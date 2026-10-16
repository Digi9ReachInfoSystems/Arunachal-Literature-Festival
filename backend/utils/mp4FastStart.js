// Moves an MP4's "moov" index box in front of the media data ("fast start"), without re-encoding.
// Browsers need the index before they can start playing; when it sits at the end of the file
// (common in exports), phones must fetch the end of the file first, so the video starts slowly.
// Port of FFmpeg's tools/qt-faststart.c logic. On anything unexpected the original buffer is
// returned unchanged, so an upload is never broken by this step.

const CONTAINER_BOXES = new Set(["moov", "trak", "mdia", "minf", "stbl"]);

function readTopLevelBoxes(buf) {
  const boxes = [];
  let offset = 0;
  while (offset + 8 <= buf.length) {
    let size = buf.readUInt32BE(offset);
    const type = buf.toString("latin1", offset + 4, offset + 8);
    if (size === 1) {
      if (offset + 16 > buf.length) return null;
      const large = buf.readBigUInt64BE(offset + 8);
      if (large > BigInt(Number.MAX_SAFE_INTEGER)) return null;
      size = Number(large);
    } else if (size === 0) {
      size = buf.length - offset; // box runs to the end of the file
    }
    if (size < 8 || offset + size > buf.length) return null;
    boxes.push({ type, start: offset, size });
    offset += size;
  }
  return offset === buf.length ? boxes : null;
}

// Adds `shift` to every chunk offset (stco / co64) inside the moov box. Returns false if an
// offset would no longer fit in a 32-bit stco entry (FFmpeg upgrades to co64; we just skip).
function shiftChunkOffsets(moov, start, end, shift, depth = 0) {
  if (depth > 10) return false;
  let offset = start;
  while (offset + 8 <= end) {
    const size = moov.readUInt32BE(offset);
    const type = moov.toString("latin1", offset + 4, offset + 8);
    if (size < 8 || offset + size > end) return false;

    if (CONTAINER_BOXES.has(type)) {
      if (!shiftChunkOffsets(moov, offset + 8, offset + size, shift, depth + 1)) return false;
    } else if (type === "stco" || type === "co64") {
      const entrySize = type === "stco" ? 4 : 8;
      const count = moov.readUInt32BE(offset + 12);
      if (16 + count * entrySize > size) return false;
      for (let i = 0; i < count; i += 1) {
        const pos = offset + 16 + i * entrySize;
        if (type === "stco") {
          const value = moov.readUInt32BE(pos) + shift;
          if (value > 0xffffffff) return false;
          moov.writeUInt32BE(value, pos);
        } else {
          moov.writeBigUInt64BE(moov.readBigUInt64BE(pos) + BigInt(shift), pos);
        }
      }
    }
    offset += size;
  }
  return true;
}

export function fastStartMp4(buffer) {
  try {
    const boxes = readTopLevelBoxes(buffer);
    if (!boxes) return buffer;
    const moovIndex = boxes.findIndex((b) => b.type === "moov");
    const mdatIndex = boxes.findIndex((b) => b.type === "mdat");
    // Already fast-start, not a plain MP4, or fragmented: leave as is.
    if (moovIndex < 0 || mdatIndex < 0 || moovIndex < mdatIndex) return buffer;
    if (boxes.some((b) => b.type === "moof")) return buffer;

    const moovBox = boxes[moovIndex];
    // A 64-bit moov header is not expected here; keep the original in that case.
    if (buffer.readUInt32BE(moovBox.start) === 1) return buffer;
    const moov = Buffer.from(buffer.subarray(moovBox.start, moovBox.start + moovBox.size));
    if (moov.includes(Buffer.from("cmov"))) return buffer; // compressed index, unsupported

    // Everything from the first mdat onward moves forward by the size of the moov box.
    if (!shiftChunkOffsets(moov, 8, moov.length, moovBox.size)) return buffer;

    const parts = [];
    boxes.forEach((box, index) => {
      if (index === mdatIndex) parts.push(moov);
      if (index !== moovIndex) parts.push(buffer.subarray(box.start, box.start + box.size));
    });
    const result = Buffer.concat(parts);
    return result.length === buffer.length ? result : buffer;
  } catch (error) {
    console.error("MP4 fast-start skipped:", error.message);
    return buffer;
  }
}

export function isMp4Upload(file) {
  const name = String(file?.originalname || "").toLowerCase();
  return /\.(mp4|m4v|mov)$/.test(name) || ["video/mp4", "video/quicktime", "video/x-m4v"].includes(file?.mimetype);
}

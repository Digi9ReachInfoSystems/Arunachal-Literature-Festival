function isNumbered(item) {
  const order = Number(item?.order);
  return Number.isFinite(order) && order > 0;
}

function byCreatedAt(a, b) {
  return new Date(a?.createdAt || 0) - new Date(b?.createdAt || 0);
}

export function sortByDisplayOrder(items) {
  const list = [...items];
  const numbered = list.filter(isNumbered).sort((a, b) => {
    const diff = Number(a.order) - Number(b.order);
    if (diff !== 0) return diff;
    return byCreatedAt(a, b);
  });
  const unnumbered = list.filter((item) => !isNumbered(item)).sort(byCreatedAt);
  const result = [];

  for (const item of numbered) {
    let slot = Math.max(0, Number(item.order) - 1);
    while (result[slot] != null) slot += 1;
    result[slot] = item;
  }

  let cursor = 0;
  for (const item of unnumbered) {
    while (result[cursor] != null) cursor += 1;
    result[cursor] = item;
    cursor += 1;
  }

  return result.filter((item) => item != null);
}

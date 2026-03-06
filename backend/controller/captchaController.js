import svgCaptcha from 'svg-captcha-fixed';
import crypto from 'crypto';

const captchaStore = new Map();
const CAPTCHA_EXPIRY_MS = 5 * 60 * 1000;

function cleanExpired() {
  const now = Date.now();
  for (const [id, entry] of captchaStore) {
    if (now - entry.createdAt > CAPTCHA_EXPIRY_MS) {
      captchaStore.delete(id);
    }
  }
}

export const generateCaptcha = async (req, res) => {
  try {
    cleanExpired();

    const captcha = svgCaptcha.create({
      size: 8,
      ignoreChars: '0oO1ilI',
      noise: 4,
      color: true,
      background: '#0a1628',
      width: 280,
      height: 80,
      fontSize: 45,
    });

    const captchaId = crypto.randomUUID();

    captchaStore.set(captchaId, {
      text: captcha.text.toLowerCase(),
      createdAt: Date.now(),
    });

    res.json({
      success: true,
      captchaId,
      svg: captcha.data,
    });
  } catch (error) {
    console.error('CAPTCHA generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating CAPTCHA',
    });
  }
};

export const verifyCaptcha = (captchaId, userInput) => {
  if (!captchaId || !userInput) return false;

  const entry = captchaStore.get(captchaId);
  if (!entry) return false;

  captchaStore.delete(captchaId);

  if (Date.now() - entry.createdAt > CAPTCHA_EXPIRY_MS) return false;

  return entry.text === userInput.toLowerCase().trim();
};

import { randomInt } from 'crypto';

const DEFAULT_PREFIX = 'OIY-26';
const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export function generateOrderCode(prefix = DEFAULT_PREFIX, length = 5): string {
  let suffix = '';
  for (let i = 0; i < length; i += 1) {
    const index = randomInt(0, ALPHABET.length);
    suffix += ALPHABET[index];
  }
  return `${prefix}-${suffix}`;
}

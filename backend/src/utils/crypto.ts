import crypto from 'crypto';

export function randomId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

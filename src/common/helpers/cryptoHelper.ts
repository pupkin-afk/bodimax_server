import * as crypto from "crypto";

export function generateString(length: number) {
    return crypto.randomBytes(length / 2).toString('hex');
}

export function hash256(code: string) {
  return crypto.createHash('sha256').update(code).digest('hex');
}
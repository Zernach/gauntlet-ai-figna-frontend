import { isWeb } from '@/constants';
import * as Crypto from 'expo-crypto';

export function generateRandomUuid(): string {
  // 1️⃣ Native (iOS / Android) via expo-crypto
  if (!isWeb && typeof Crypto.randomUUID === 'function') {
    return Crypto.randomUUID();
  }

  // 2️⃣ Web via globalThis.crypto
  if (
    isWeb &&
    typeof globalThis.crypto === 'object' &&
    typeof globalThis.crypto.randomUUID === 'function'
  ) {
    return globalThis.crypto.randomUUID();
  }

  // 3️⃣ Fallback to JS—*not* cryptographically secure
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

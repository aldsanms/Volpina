// src/utils/cryptoUtils.js

import * as Crypto from 'expo-crypto';

// ---------------------------------------------------------
// 🔐 Génère une clé maître 256 bits (32 bytes en base64)
// ---------------------------------------------------------
export async function generateMasterKey() {
  const keyBytes = Crypto.getRandomBytes(32); // 256 bits
  return Buffer.from(keyBytes).toString('base64');
}

// ---------------------------------------------------------
// 🔐 Génére une clé IV 96 bits pour AES-GCM (12 bytes)
// ---------------------------------------------------------
function generateIV() {
  return Crypto.getRandomBytes(12); // 12 bytes pour AES-GCM
}

// ---------------------------------------------------------
// 🔐 Dérivation SHA256 → clé AES 32 bytes
// ---------------------------------------------------------
async function deriveKeyFromPassword(password) {
  const hashHex = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    password
  );
  return Buffer.from(hashHex, 'hex').slice(0, 32); // clé AES 256 bits
}

// ---------------------------------------------------------
// 🔐 AES-256-GCM Encryption
// ---------------------------------------------------------
export async function encryptAES256GCM(password, plaintext) {
  const key = await deriveKeyFromPassword(password);
  const iv = generateIV();

  const aes = new Crypto.CryptoDigestAlgorithm.AES256GCM();

  const encrypted = await aes.encrypt({
    key,
    iv,
    data: Buffer.from(plaintext, 'utf8'),
  });

  // Concat [IV | ciphertext | tag]
  const full = Buffer.concat([
    iv, 
    encrypted.ciphertext, 
    encrypted.tag
  ]);

  return full.toString('base64');
}

// ---------------------------------------------------------
// 🔓 AES-256-GCM Decryption
// ---------------------------------------------------------
export async function decryptAES256GCM(password, base64data) {
  const key = await deriveKeyFromPassword(password);

  const buffer = Buffer.from(base64data, 'base64');

  const iv = buffer.slice(0, 12);                          // 12 bytes
  const ciphertext = buffer.slice(12, buffer.length - 16); // -16 tag
  const tag = buffer.slice(buffer.length - 16);

  const aes = new Crypto.CryptoDigestAlgorithm.AES256GCM();

  const decrypted = await aes.decrypt({
    key,
    iv,
    ciphertext,
    tag,
  });

  return decrypted.toString('utf8');
}

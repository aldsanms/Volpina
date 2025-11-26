import CryptoJS from "crypto-js";

// AES encrypt
export function aesEncrypt(plaintext, keyStr) {
  const key = CryptoJS.enc.Utf8.parse(keyStr);
  const iv = CryptoJS.enc.Utf8.parse(keyStr.substring(0, 16));

  const encrypted = CryptoJS.AES.encrypt(plaintext, key, {
    iv: iv,
    padding: CryptoJS.pad.Pkcs7,
    mode: CryptoJS.mode.CBC,
  });

  return encrypted.toString();
}

// AES decrypt
export function aesDecrypt(ciphertext, keyStr) {
  try {
    const key = CryptoJS.enc.Utf8.parse(keyStr);
    const iv = CryptoJS.enc.Utf8.parse(keyStr.substring(0, 16));

    const decrypted = CryptoJS.AES.decrypt(ciphertext, key, {
      iv: iv,
      padding: CryptoJS.pad.Pkcs7,
      mode: CryptoJS.mode.CBC,
    });

    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch {
    return null;
  }
}

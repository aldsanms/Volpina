import { aesEncrypt, aesDecrypt } from "./cryptoUtils";

/**
 * Chiffre un message texte avec la clé AES de la conversation
 */
export function encryptMessage(text, convKey) {
  return aesEncrypt(text, convKey);
}

/**
 * Déchiffre un message texte avec la clé AES de la conversation
 */
export function decryptMessage(cipher, convKey) {
  return aesDecrypt(cipher, convKey);
}

/**
 * Déchiffre tous les messages d'un fichier conv_x.json
 */
export function decryptMessageList(messages, convKey) {
  return messages.map(msg => ({
    ...msg,
    text: decryptMessage(msg.text, convKey)
  }));
}

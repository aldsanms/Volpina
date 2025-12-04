import { aesEncrypt, aesDecrypt } from "./cryptoUtils";

export function encryptConvFields(conv, H_master) {
  return {
    ...conv,
    // id TOUJOURS en clair
    name: aesEncrypt(conv.name, H_master),
    key: aesEncrypt(conv.key, H_master),
    idPerso: aesEncrypt(conv.idPerso, H_master),
  };
}

export function decryptConvFields(conv, H_master) {
  return {
    ...conv,
    // id TOUJOURS en clair
    name: aesDecrypt(conv.name, H_master),
    key: aesDecrypt(conv.key, H_master),
    idPerso: aesDecrypt(conv.idPerso, H_master),
  };
}

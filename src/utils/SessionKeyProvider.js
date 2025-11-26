import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import { aesDecrypt } from "./CryptoTools";

export async function getHMasterFromPIN(pin) {
  const H_pin = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    "VOLPINA_PIN" + pin
  );

  const encrypted = await AsyncStorage.getItem("volpina_master_encrypted");
  if (!encrypted) return null;

  try {
    const H_master = await aesDecrypt(encrypted, H_pin);
    return H_master;
  } catch (_) {
    return null;
  }
}

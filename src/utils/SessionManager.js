// src/utils/SessionManager.js

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from "expo-file-system/legacy";

// -----------------------------
// 🔐 MASTER HASH (permanent)
// -----------------------------
export async function saveMasterHash(hash) {
  await AsyncStorage.setItem("volpina_master_hash", hash);
}

export async function getMasterHash() {
  return await AsyncStorage.getItem("volpina_master_hash");
}

// -----------------------------
// 🔐 ENCRYPTED MASTER KEY (reset au PIN faux)
// -----------------------------
export async function saveEncryptedMasterKey(x) {
  await AsyncStorage.setItem("volpina_encrypted_master_key", x);
}

export async function getEncryptedMasterKey() {
  return await AsyncStorage.getItem("volpina_encrypted_master_key");
}

export async function resetEncryptedMasterKey() {
  await AsyncStorage.removeItem("volpina_encrypted_master_key");
}

// -----------------------------
// 🔐 PIN HASH
// -----------------------------
export async function savePinHash(hash) {
  await AsyncStorage.setItem("volpina_pin_hash", hash);
}

export async function getPinHash() {
  return await AsyncStorage.getItem("volpina_pin_hash");
}

// -----------------------------
// 🔐 SESSION
// -----------------------------
export async function createSession() {
  await AsyncStorage.setItem(
    "volpina_session",
    JSON.stringify({ lastActive: Date.now() })
  );
}

export async function isSessionExpired(minutes) {
  const raw = await AsyncStorage.getItem("volpina_session");
  if (!raw) return true;

  const { lastActive } = JSON.parse(raw);
  return Date.now() - lastActive > minutes * 60_000;
}

export async function setLastActive() {
  const raw = await AsyncStorage.getItem("volpina_session");
  if (!raw) return;
  const s = JSON.parse(raw);
  s.lastActive = Date.now();
  await AsyncStorage.setItem("volpina_session", JSON.stringify(s));
}

// -----------------------------
// ❌ PIN BLOCK SYSTEM
// -----------------------------
export async function getPinBlockUntil() {
  return parseInt(await AsyncStorage.getItem("volpina_pin_block_until")) || 0;
}

export async function setPinBlockUntil(ts) {
  await AsyncStorage.setItem("volpina_pin_block_until", ts.toString());
}

export async function getPinAttempts() {
  return parseInt(await AsyncStorage.getItem("volpina_pin_attempts")) || 0;
}

export async function increasePinAttempts() {
  const x = (await getPinAttempts()) + 1;
  await AsyncStorage.setItem("volpina_pin_attempts", x.toString());
  return x;
}

export async function resetPinAttempts() {
  await AsyncStorage.multiRemove([
    "volpina_pin_attempts",
    "volpina_pin_block_until"
  ]);
}

// -----------------------------
// ❌ MDP BLOCK SYSTEM
// -----------------------------
export async function getMDPAttempts() {
  return parseInt(await AsyncStorage.getItem("volpina_mdp_attempts")) || 0;
}

export async function increaseMDPAttempts() {
  const x = (await getMDPAttempts()) + 1;
  await AsyncStorage.setItem("volpina_mdp_attempts", x.toString());
  return x;
}

export async function resetMDPAttempts() {
  await AsyncStorage.multiRemove([
    "volpina_mdp_attempts",
    "volpina_mdp_block_until"
  ]);
}

export async function getMDPBlockUntil() {
  return parseInt(await AsyncStorage.getItem("volpina_mdp_block_until")) || 0;
}

export async function setMDPBlockUntil(ts) {
  await AsyncStorage.setItem("volpina_mdp_block_until", ts.toString());
}

// -----------------------------
// 💣 WIPE TOTAL (9 erreurs MDP)
// -----------------------------
export async function wipeEverything() {

  await AsyncStorage.multiRemove([
    "volpina_pin_hash",
    "volpina_master_hash",
    "volpina_encrypted_master_key",
    "volpina_session",
    "volpina_pin_attempts",
    "volpina_pin_block_until",
    "volpina_mdp_attempts",
    "volpina_mdp_block_until",
  ]);

  const files = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory);

  for (const file of files) {
    if (file.startsWith("conv_") ||
        file === "conversations.json" ||
        file === "users.json") {
      await FileSystem.deleteAsync(FileSystem.documentDirectory + file, { idempotent: true });
    }
  }
}

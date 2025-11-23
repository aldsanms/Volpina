import AsyncStorage from '@react-native-async-storage/async-storage';

const MASTER_KEY = "volpina_master_hash";
const PIN_KEY = "volpina_pin_hash";
const LAST_ACTIVE = "volpina_last_active";
const SESSION_CREATED = "volpina_session_created";

export async function getMasterHash() {
  return await AsyncStorage.getItem(MASTER_KEY);
}

export async function getPinHash() {
  return await AsyncStorage.getItem(PIN_KEY);
}

export async function setLastActive() {
  await AsyncStorage.setItem(LAST_ACTIVE, Date.now().toString());
}

export async function getLastActive() {
  const v = await AsyncStorage.getItem(LAST_ACTIVE);
  return v ? parseInt(v) : null;
}

export async function createSession() {
  const now = Date.now();
  await AsyncStorage.setItem(SESSION_CREATED, now.toString());
  await AsyncStorage.setItem(LAST_ACTIVE, now.toString());
}

export async function getSessionCreated() {
  const v = await AsyncStorage.getItem(SESSION_CREATED);
  return v ? parseInt(v) : null;
}

export async function clearSession() {
  await AsyncStorage.removeItem(SESSION_CREATED);
  await AsyncStorage.removeItem(LAST_ACTIVE);
}

export async function resetToMaster() {
  await clearSession();
}

export async function isSessionExpired(maxMinutes = 10) {
  const last = await getLastActive();
  if (!last) return true;
  return (Date.now() - last) > maxMinutes * 60000;
}

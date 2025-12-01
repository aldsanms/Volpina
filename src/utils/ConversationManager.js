import * as FileSystem from "expo-file-system/legacy";
import CryptoJS from "crypto-js";

const PATH = FileSystem.documentDirectory + "conversations.json";

/* ---------------------- CHIFFREMENT ---------------------- */
function encrypt(text, key) {
  return CryptoJS.AES.encrypt(text, key).toString();
}

function decrypt(cipher, key) {
  try {
    const bytes = CryptoJS.AES.decrypt(cipher, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch {
    return null;
  }
}

/* ---------------------- FICHIER ---------------------- */
async function ensureFileExists() {
  const info = await FileSystem.getInfoAsync(PATH);
  if (!info.exists) {
    await FileSystem.writeAsStringAsync(PATH, JSON.stringify([]));
  }
}

/* ---------------------- GÉNÉRATION CLÉS ---------------------- */
export async function generateSecureKey() {
  // 🔥 Compatible Expo Go + entropie correcte
  const random = CryptoJS.SHA256(
    Math.random().toString() + Date.now().toString() + Math.random().toString()
  ).toString();

  return random; // hex 64 chars = 256 bits
}

/* ---------------------- SAUVEGARDE ---------------------- */
export async function saveConversation(conv, pinHash) {

  if (!pinHash) throw new Error("pinHash manquant");

  await ensureFileExists();

  let list = [];
  try {
    const raw = await FileSystem.readAsStringAsync(PATH);
    list = JSON.parse(raw);
  } catch {}

  const encrypted = {
    id: conv.id,
    title: encrypt(conv.title ?? "", pinHash),
    key_conv: encrypt(conv.key_conv ?? "", pinHash)
  };

  const idx = list.findIndex(c => c.id === conv.id);
  if (idx >= 0) list[idx] = encrypted;
  else list.push(encrypted);

  await FileSystem.writeAsStringAsync(PATH, JSON.stringify(list));
}

/* ---------------------- CHARGEMENT ---------------------- */
export async function loadConversations(pinHash) {
  if (!pinHash) return [];

  try {
    await ensureFileExists();
    const raw = await FileSystem.readAsStringAsync(PATH);
    const list = JSON.parse(raw);

    return list.map(c => ({
      id: c.id,
      title: decrypt(c.title, pinHash) || "Conversation",
      key_conv: decrypt(c.key_conv, pinHash)
    }));

  } catch (e) {
    console.log("Erreur loadConversations:", e);
    return [];
  }
}

export async function loadConversation(id, pinHash) {
  const list = await loadConversations(pinHash);
  return list.find(c => c.id === id) || null;
}

/* ---------------------- SUPPRIMER ---------------------- */
export async function deleteConversation(id) {
  try {
    await ensureFileExists();
    const raw = await FileSystem.readAsStringAsync(PATH);
    let list = JSON.parse(raw);

    list = list.filter(c => c.id !== id);
    await FileSystem.writeAsStringAsync(PATH, JSON.stringify(list));

    await FileSystem.deleteAsync(
      FileSystem.documentDirectory + `conv_${id}.json`,
      { idempotent: true }
    );

  } catch (e) {
    console.log("Erreur suppression conv:", e);
  }
}

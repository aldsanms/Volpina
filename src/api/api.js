import { aesEncrypt, aesDecrypt } from "../utils/cryptoUtils";
import * as FileSystem from "expo-file-system/legacy";

const API_URL = "https://volpina-api.onrender.com";

export async function fetchMessages(convId) {
  try {
    const response = await fetch(`${API_URL}/messages`);
    const allMessages = await response.json();

    // On filtre uniquement pour cette conversation
    // Charger clé locale
    const path = FileSystem.documentDirectory + "conversations.json";
    const raw = await FileSystem.readAsStringAsync(path);
    const list = JSON.parse(raw);
    const conv = list.find(c => c.id === convId);

if (!conv) return [];

const key = conv.key;

// Déchiffrement
return allMessages
  .filter(m => m.conv_id === convId)
  .map(m => ({
    ...m,
    text: aesDecrypt(m.text, key) // ← décryptage ici
  }));

  } catch (e) {
    console.log("Erreur fetchMessages:", e);
    return [];
  }
}

export async function sendMessage(convId, plaintext, sender = null) {
  try {
    // Charger les conversations locales pour récupérer la clé AES
    const path = FileSystem.documentDirectory + "conversations.json";
    const raw = await FileSystem.readAsStringAsync(path);
    const list = JSON.parse(raw);
    const conv = list.find(c => c.id === convId);

    if (!conv) {
      console.log("Conversation introuvable localement !");
      return false;
    }

    const key = conv.key;

    // Chiffrement local AVANT envoi
    const encrypted = aesEncrypt(plaintext, key);

    const payload = {
      conv_id: convId,
      text: encrypted,
      timestamp: Date.now(),
      sender: sender
    };

    const response = await fetch(`${API_URL}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    return response.ok;
  } catch (e) {
    console.log("Erreur sendMessage:", e);
    return false;
  }
}


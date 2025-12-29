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

const key = globalThis.currentConvKey;

// Déchiffrement
return allMessages
  .filter(m => m.conv_id === convId)
  .map(m => ({
    ...m,
    text: aesDecrypt(m.text, key) 
  }));

  } catch (e) {
    console.log("Erreur fetchMessages:", e);
    return [];
  }
}

export async function sendMessage(convId, plaintext, sender = null, isSave = false, param = {}) {
  try {
    // Charger la clé de la conversation
    const path = FileSystem.documentDirectory + "conversations.json";
    const raw = await FileSystem.readAsStringAsync(path);
    const list = JSON.parse(raw);
    const conv = list.find(c => c.id === convId);

    if (!conv) {
      console.log("Conversation introuvable localement !");
      return false;
    }

    const key = globalThis.currentConvKey;

    // Chiffrement du message
    const encrypted = aesEncrypt(plaintext, key);

    const payload = {
      conv_id: convId,
      text: encrypted,
      timestamp: Date.now(),
      sender: sender,
      isSave: isSave,  
      param: param    
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

export async function saveMessage(messageId) {
  try {
    const res = await fetch(`${API_URL}/messages/${messageId}/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });

    return res.ok;
  } catch (e) {
    console.error("saveMessage error", e);
    return false;
  }
}

export async function unsaveMessage(messageId) {
  try {
    const res = await fetch(`${API_URL}/messages/${messageId}/unsave`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
    return res.ok;
  } catch (e) {
    console.error("unsaveMessage error", e);
    return false;
  }
}

export async function deleteMessage(messageId) {
  try {
    const res = await fetch(`${API_URL}/messages/${messageId}`, {
      method: "DELETE",
    });
    return res.ok;
  } catch (e) {
    console.error("deleteMessage error", e);
    return false;
  }
}

export async function deleteConvBdd(convId) {
  try {
    const res = await fetch(`${API_URL}/conversations/${convId}`, {
      method: "DELETE",
    });
    return res.ok;
  } catch (e) {
    console.error("deleteConvBdd error", e);
    return false;
  }
}

export async function fetchConversations(userId) {
  try {
    const res = await fetch(`${API_URL}/conversations?userId=${userId}`);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function fetchLastTimes(convIds) {
  try {
    const res = await fetch(`${API_URL}/conversations-last-time`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ convIds }),
    });

    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    console.error(e);
    return [];
  }
}


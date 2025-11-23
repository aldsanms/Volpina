import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

export async function createNewConversation() {
  // 1. ID unique
  const convId = "conv_" + Crypto.randomUUID();

  // 2. Clé AES 256 bits (32 bytes)
  const keyBytes = Crypto.getRandomBytes(32);
  const keyBase64 = Buffer.from(keyBytes).toString("base64");

  // 3. Charger json local
  const raw = await AsyncStorage.getItem("volpina_conversations");
  let data = raw ? JSON.parse(raw) : { conversations: {} };

  // 4. Ajouter la nouvelle conversation
  data.conversations[convId] = {
    name: "Nouvelle conversation",
    key: keyBase64,
    createdAt: Date.now(),
    lastMessage: null
  };

  // 5. Sauvegarder
  await AsyncStorage.setItem("volpina_conversations", JSON.stringify(data));

  return {
    convId,
    key: keyBase64
  };
}

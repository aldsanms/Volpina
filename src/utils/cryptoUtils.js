import * as Crypto from 'expo-crypto';
import { Buffer } from 'buffer'; 

export async function generateConversationKey() {
  const randomBytes = await Crypto.getRandomBytesAsync(32);
  return Buffer.from(randomBytes).toString('base64'); 
}

export function generateConversationID(length = 20) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let id = '';
  for (let i = 0; i < length; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

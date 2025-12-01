import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import QRCode from "react-native-qrcode-svg";
import colors from "../theme/colors";

import { saveConversation, generateSecureKey } from "../utils/ConversationManager";

export default function EditConvScreen({ navigation }) {

  const [qr, setQr] = useState(null);
  const [convId, setConvId] = useState(null);

  useEffect(() => {
    createConversationAuto();
  }, []);

  function generateId() {
    return Math.random().toString(36).substring(2, 12);
  }

  async function createConversationAuto() {
    try {
      const pinHash = globalThis.session_pinHash;

      if (!pinHash) {
        Alert.alert("Erreur interne", "pinHash manquant");
        return;
      }

      const id = generateId();
      const key_conv = await generateSecureKey(); // 🔥 version expo-safe

      const conv = {
        id,
        title: "Conversation",
        key_conv,
        participants: [],
        messages: []
      };

      await saveConversation(conv, pinHash);

      setConvId(id);
      setQr(JSON.stringify({ id, key: key_conv }));

    } catch (e) {
      console.log("❌ ERREUR createConversationAuto:", e);
      Alert.alert("Erreur", e.message || "Erreur inconnue");
    }
  }

  return (
    <View style={{
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
      padding: 20
    }}>

      {!qr ? (
        <Text style={{ color: "white", fontSize: 20 }}>Création…</Text>
      ) : (
        <>
          <Text style={{ color: "white", fontSize: 22, marginBottom: 20 }}>
            Nouvelle conversation
          </Text>

          <QRCode
            value={qr}
            size={220}
            color="white"
            backgroundColor="black"
          />

          <TouchableOpacity
            style={{
              marginTop: 40,
              backgroundColor: colors.primary,
              padding: 14,
              borderRadius: 10
            }}
            onPress={() => navigation.navigate("ConversationView", { convId })}
          >
            <Text style={{ color: "white", fontSize: 18 }}>Entrer dans la conversation</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ marginTop: 15, padding: 10 }}
            onPress={() => navigation.goBack()}
          >
            <Text style={{ color: "#888" }}>Annuler</Text>
          </TouchableOpacity>
        </>
      )}

    </View>
  );
}

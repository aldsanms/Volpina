import React, { useState, useEffect } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as FileSystem from "expo-file-system/legacy";
import colors from "../theme/colors";
import { decryptConvFields, encryptConvFields } from "../utils/ConversationCrypto";


export default function EditConvScreen() {

  const navigation = useNavigation();
  const route = useRoute();
  const { convId } = route.params;

  const [convName, setConvName] = useState("");

  useEffect(() => {
    loadConvData();
  }, []);

  async function loadConvData() {
    const path = FileSystem.documentDirectory + "conversations.json";

    try {
      const raw = await FileSystem.readAsStringAsync(path);
      const list = JSON.parse(raw);
      const conv = list.find(c => c.id === convId);

      if (conv){
        const dec = decryptConvFields(conv, globalThis.session_Hmaster);
setConvName(dec.name);

      }
    } catch (e) {
      console.log("Erreur lecture conversation", e);
    }
  }

  async function save() {
    const path = FileSystem.documentDirectory + "conversations.json";

    try {
      const raw = await FileSystem.readAsStringAsync(path);
      let list = JSON.parse(raw);

      list = list.map(c => {
  if (c.id !== convId) return c;

  const decrypted = decryptConvFields(c, globalThis.session_Hmaster);

  const updated = {
    ...decrypted,
    name: convName
  };

  return encryptConvFields(updated, globalThis.session_Hmaster);
});


      await FileSystem.writeAsStringAsync(path, JSON.stringify(list));
    } catch (e) {
      console.log("Erreur sauvegarde", e);
    }

    navigation.goBack();
  }

  async function deleteConv() {
    const path = FileSystem.documentDirectory + "conversations.json";

    try {
      const raw = await FileSystem.readAsStringAsync(path);
      let list = JSON.parse(raw);

      list = list.filter(c => c.id !== convId);

      await FileSystem.writeAsStringAsync(path, JSON.stringify(list));

      // Supprime aussi le fichier messages
      const msgPath = FileSystem.documentDirectory + `conv_${convId}.json`;
      await FileSystem.deleteAsync(msgPath, { idempotent: true });

    } catch (e) {
      console.log("Erreur suppression", e);
    }

    navigation.navigate("Main");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Modifier la conversation</Text>

      <TextInput
        style={styles.input}
        value={convName}
        onChangeText={setConvName}
        placeholder="Nom de la conversation"
        placeholderTextColor={colors.subtitle}
      />

      <TouchableOpacity style={styles.saveBtn} onPress={save}>
        <Text style={styles.saveText}>Enregistrer</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteBtn} onPress={deleteConv}>
        <Text style={styles.deleteText}>Supprimer la conversation</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>Retour</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
    justifyContent: "center"
  },

  title: {
    color: colors.text,
    fontSize: 24,
    marginBottom: 25,
    textAlign: "center",
    fontWeight: "bold"
  },

  input: {
    borderWidth: 1,
    borderColor: "#444",
    padding: 12,
    borderRadius: 10,
    color: colors.text,
    marginBottom: 25
  },

  saveBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 20
  },

  saveText: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold"
  },

  deleteBtn: {
    backgroundColor: "#700",
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 40
  },

  deleteText: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold"
  },

  backBtn: {
    paddingVertical: 10
  },

  backText: {
    color: colors.subtitle,
    textAlign: "center"
  }
});

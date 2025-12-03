import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import colors from '../theme/colors';
import { encryptConvFields } from "../utils/ConversationCrypto";


// 🔥 Générateur d’ID compatible Expo (remplace uuid)
function generateId() {
  return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function MenuConv() {

  const navigation = useNavigation();

  // ─────────── Message aléatoire ───────────
  const messages = [
    "Que veux-tu faire ?",
    "Une nouvelle aventure ?",
    "Avec qui veux-tu parler ?",
    "Nouvelle mission ou rejoindre quelqu’un ?",
    "On lance quoi maintenant ? 🔥",
    "Volpina attend tes ordres 🦊",
  ];

  const [message, setMessage] = useState("");

  useEffect(() => {
    const random = Math.floor(Math.random() * messages.length);
    setMessage(messages[random]);
  }, []);

  // ─────────── Créer une nouvelle conversation ───────────
  async function handleCreateConv() {
    console.log("handleCreateConv");

    const convId = generateId();
    const secretKey = generateId();

    console.log("generated IDs:", convId, secretKey);

    const path = FileSystem.documentDirectory + "conversations.json";
    let existing = [];

    console.log("prestry");

    try {
      const raw = await FileSystem.readAsStringAsync(path);
      console.log("try: conversations.json found");
      existing = JSON.parse(raw);
    } catch (e) {
      console.log("catch: conversations.json not found");
      existing = [];
    }

    console.log("existing:", existing);

    // Ajout de la nouvelle conversation
    const H_master = globalThis.session_Hmaster;
if (!H_master) {
  alert("Erreur : H_master manquant");
  return;
}

const encryptedConv = encryptConvFields({
  id: convId,                    // NON CHIFFRÉ
  key: secretKey,                // CHIFFRÉ
  name: "Nouvelle conversation", // CHIFFRÉ
  createdAt: Date.now()
}, H_master);

existing.push(encryptedConv);


    // Sauvegarde conversations.json
    await FileSystem.writeAsStringAsync(path, JSON.stringify(existing));

    // Fichier messages vide
    const convPath = FileSystem.documentDirectory + `conv_${convId}.json`;
    await FileSystem.writeAsStringAsync(convPath, JSON.stringify({ messages: [] }));

    console.log("NAVIGATE → ConversationView", convId);

    // Délai pour éviter d'être bloqué par LockScreen overlay
    setTimeout(() => {
      navigation.navigate("ConversationView", { convId });
    }, 150);
  }

  return (
    <View style={styles.container}>

      {/* ——— Logo ——— */}
      <Image 
        source={require('../theme/volpina_logo.png')}
        style={styles.logo}
      />

      {/* ——— Message aléatoire ——— */}
      <Text style={styles.title}>{message}</Text>

      {/* ——— Bouton créer ——— */}
      <TouchableOpacity style={styles.button} onPress={handleCreateConv}>
        <Text style={styles.buttonText}>Créer une conversation</Text>
      </TouchableOpacity>

      {/* ——— Bouton rejoindre ——— */}
      <TouchableOpacity 
        style={[styles.button, styles.buttonSecondary]}
        onPress={() => navigation.navigate("ScanConversation")}
      >
        <Text style={styles.buttonText}>Rejoindre une conversation</Text>
      </TouchableOpacity>

      {/* ——— Retour ——— */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backText}>Retour</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container:{
    flex:1,
    backgroundColor: colors.background,
    justifyContent:'center',
    alignItems:'center',
    paddingHorizontal:20
  },

  logo:{
    width:90,
    height:90,
    marginBottom:25
  },

  title:{
    fontSize:26,
    color:colors.text,
    marginBottom:40,
    textAlign:'center'
  },

  button:{
    backgroundColor:colors.primary,
    paddingVertical:15,
    paddingHorizontal:25,
    borderRadius:12,
    width:'100%',
    marginBottom:20
  },

  buttonSecondary:{
    backgroundColor:"#333"
  },

  buttonText:{
    textAlign:'center',
    color:'white',
    fontSize:18,
    fontWeight:'600'
  },

  backButton:{
    marginTop:20
  },

  backText:{
    color:colors.subtitle,
    fontSize:16
  }
});

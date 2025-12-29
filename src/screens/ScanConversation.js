import { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from "expo-file-system/legacy";
import colors from '../theme/colors';
import { encryptConvFields } from "../utils/ConversationCrypto";

export default function ScanConversation({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [qrData, setQrData] = useState(null);

  // Générateur simple d'ID local
  function generateId() {
    return Math.random().toString(36).substring(2, 12);
  }

  // Ajout local d’une conversation à partir du QR
  async function importConversation(json) {
    const { id, key } = json;

    if (!id || !key) {
      alert("QR incomplet !");
      return;
    }

    const myIdPerso = generateId(); // ID local de l’utilisateur

    // Charger conversations existantes
    const path = FileSystem.documentDirectory + "conversations.json";
    let list = [];

    try {
      const raw = await FileSystem.readAsStringAsync(path);
      list = JSON.parse(raw);
    } catch {
      list = [];
    }

    // Vérifier si la conv est déjà importée
    const already = list.find(c => c.id === id);
    if (already) {
      alert("Conversation déjà importée !");
      return id;
    }

    // Création locale identique à handleCreateConv()
    const encryptedConv = encryptConvFields({
      id,              // Reçu du QR
      key,             // Reçu du QR
      name: "Nouvelle conversation", // Nom local editable
      idPerso: myIdPerso,
      createdAt: Date.now()
    }, globalThis.session_Hmaster);

    list.push(encryptedConv);

    // Sauvegarde
    await FileSystem.writeAsStringAsync(path, JSON.stringify(list));

    // Créer fichier de messages vide
    const convPath = FileSystem.documentDirectory + `conv_${id}.json`;
    await FileSystem.writeAsStringAsync(convPath, JSON.stringify({ messages: [] }));

    return id;
  }

  // Gestion du scan
  const handleScan = async ({ data }) => {
    setScanned(true);

    try {
      const json = JSON.parse(data); // Contenu du QR
      const handleScan = async ({ data }) => {
  setScanned(true);

  try {
    const json = JSON.parse(data); // { id, key }

    if (!json.id || !json.key) {
      alert("QR invalide !");
      return;
    }

    //  Chiffrement de la clé
    const encryptedKey = encryptField(json.key, globalThis.session_Hmaster);

    //  Ajout dans conversations.json
    const path = FileSystem.documentDirectory + "conversations.json";
    let list = [];

    try {
      const raw = await FileSystem.readAsStringAsync(path);
      list = JSON.parse(raw);
    } catch {}

    const newConv = {
      id: json.id,
      key: encryptedKey,        //  Version CHIFFRÉE
      name: "Nouvelle conversation",
      idPerso: Math.random().toString(36).substring(2, 10),
      createdAt: Date.now()
    };

    list.push(newConv);

    await FileSystem.writeAsStringAsync(path, JSON.stringify(list));

    alert("Conversation importée !");
    setQrData(json);

  } catch (e) {
    console.log(e);
    alert("QR Code invalide !");
  }
};

      setQrData(json);

      const convId = await importConversation(json);

      if (convId) {
        alert("Conversation importée !");
        navigation.navigate("ConversationView", { convId });
      }

    } catch (e) {
      alert("QR Code invalide !");
      setScanned(false);
    }
  };

  // Demander permission caméra
  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, []);

  // Pendant la demande
  if (!permission) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Chargement…</Text>
      </View>
    );
  }

  // Permission refusée
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Permission refusée</Text>
        <Text style={styles.textSmall}>Active la caméra dans les paramètres</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!scanned ? (
        <CameraView
          style={StyleSheet.absoluteFillObject}
          onBarcodeScanned={handleScan}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        />
      ) : (
        <View style={styles.center}>
          <Text style={styles.text}>Conversation détectée !</Text>
          <Text style={styles.textSmall}>ID : {qrData?.id}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: colors.text,
    fontSize: 20,
  },
  textSmall: {
    color: colors.subtitle,
    marginTop: 10,
  }
});

import { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Camera, CameraView } from "expo-camera";
import colors from "../theme/colors";
import { saveConversation } from "../utils/ConversationManager";

export default function ScanConversation({ navigation }) {
  const [permission, setPermission] = useState(null);
  const scanningRef = useRef(true);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setPermission(status === "granted");
    })();
  }, []);

  async function handleScan(scanData) {
    if (!scanningRef.current) return;
    scanningRef.current = false;

    try {
      const obj = JSON.parse(scanData.data);

      const conv = {
        id: obj.id,
        key_conv: obj.key,
        title: "Conversation",
        participants: [],
        messages: []
      };

      await saveConversation(conv);
      navigation.goBack();
    }
    catch (e) {
      alert("QR code invalide");
      scanningRef.current = true;
    }
  }

  if (permission === null) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Demande d’accès caméra…</Text>
      </View>
    );
  }

  if (permission === false) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Permission caméra refusée</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      <CameraView
        style={{ flex: 1 }}
        onBarcodeScanned={handleScan}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
      />

      <View style={styles.overlay}>
        <Text style={styles.info}>Scanne un QR Code Volpina</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background
  },
  text: {
    color: "white",
    fontSize: 18
  },
  overlay: {
    position: "absolute",
    bottom: 40,
    width: "100%",
    alignItems: "center"
  },
  info: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10
  }
});

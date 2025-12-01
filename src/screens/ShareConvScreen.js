import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import QRCode from "react-native-qrcode-svg";
import colors from "../theme/colors";

export default function ShareConvScreen() {

  const route = useRoute();
  const navigation = useNavigation();
  
  const conv = route.params?.conv;

  if (!conv) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "white" }}>Erreur : conversation introuvable</Text>
      </View>
    );
  }

  const qrData = JSON.stringify({
    id: conv.id,
    key: conv.key_conv
  });

  return (
    <View style={styles.container}>

      <Text style={styles.title}>Partager cette conversation</Text>

      <View style={styles.qrContainer}>
        <QRCode
          value={qrData}
          size={250}
          backgroundColor="white"
          color="black"
        />
      </View>

      <Text style={styles.subtitle}>Scannez ce QR code pour rejoindre</Text>

      <TouchableOpacity
        style={styles.enterButton}
        onPress={() => {
          // 🔥 Ouvre l'app et débloque la navigation
          globalThis.unlockApp?.();

          // 🔥 Va directement dans la conversation
          navigation.replace("ConversationView", { convId: conv.id });
        }}
      >
        <Text style={styles.enterText}>Entrer dans la conversation</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 60,
    alignItems: "center"
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "white",
    marginBottom: 30,
  },

  qrContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 18,
    marginBottom: 20,
  },

  subtitle: {
    fontSize: 16,
    color: colors.subtitle,
    marginBottom: 40
  },

  enterButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    marginTop: 20
  },

  enterText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold"
  }
});

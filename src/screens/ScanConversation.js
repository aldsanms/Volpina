import { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import colors from '../theme/colors';

export default function ScanConversation() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [qrData, setQrData] = useState(null);

  // Demander la permission au démarrage
  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, []);

  // Gestion du scan
  const handleScan = ({ data }) => {
    setScanned(true);

    try {
      const json = JSON.parse(data); // data = contenu du QR

      setQrData(json);
      alert("Conversation importée !");
    } catch (e) {
      alert("QR Code invalide !");
    }
  };

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
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
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

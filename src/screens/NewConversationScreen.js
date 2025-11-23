import { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { generateConversationKey, generateConversationID } from '../utils/cryptoUtils';
import colors from '../theme/colors';

export default function NewConversationScreen() {
  const [convData, setConvData] = useState(null);

  useEffect(() => {
    async function makeConv() {
      const id = generateConversationID();
      const key = await generateConversationKey();
      setConvData({ id, key });
    }
    makeConv();
  }, []);

  if (!convData) {
    return (
      <View style={styles.loading}>
        <Text style={{ color: colors.text }}>Génération…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Partagez cette clé de conversation</Text>

      <QRCode
        value={JSON.stringify(convData)}
        size={230}
        color="white"
        backgroundColor="black"
      />

      <Text style={styles.note}>
        Scannez ce QR avec l'autre appareil
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 20,
    marginBottom: 25,
    textAlign: 'center',
  },
  note: {
    marginTop: 20,
    color: colors.subtitle,
    fontSize: 14,
  },
});

import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

import colors from '../theme/colors';
import { aesEncrypt, aesDecrypt } from '../utils/cryptoUtils';
import { resetToMaster, setLastActive } from '../utils/SessionManager';

export default function PINScreen({ onSuccess, setLogged }) {

  const [pin, setPin] = useState('');
  const [storedHash, setStoredHash] = useState(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadPIN();
  }, []);

  const loadPIN = async () => {
    const saved = await AsyncStorage.getItem("volpina_pin_hash");
    if (saved) {
      setStoredHash(saved);
      setCreating(false);
    } else {
      setCreating(true);
    }
  };

  const pressDigit = async (digit) => {
    const newPin = pin + digit;
    setPin(newPin);

    if (newPin.length !== 4) return;

    const H_pin = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      "VOLPINA_PIN" + newPin
    );

    // CREATION
    if (creating) {
      const H_master = globalThis.session_Hmaster;
      if (!H_master) {
        alert("Erreur interne : H_master manquant");
        setLogged(false);
        return;
      }

      const encryptedMaster = aesEncrypt(H_master, H_pin);

      await AsyncStorage.setItem("volpina_pin_hash", H_pin);
      await AsyncStorage.setItem("volpina_master_encrypted", encryptedMaster);

      await setLastActive();
      onSuccess();
      return;
    }

    // AUTHENTICATION
    if (H_pin === storedHash) {
      const encryptedMaster = await AsyncStorage.getItem("volpina_master_encrypted");
      if (!encryptedMaster) {
        alert("Master chiffré manquant");
        setLogged(false);
        return;
      }

      const H_master = aesDecrypt(encryptedMaster, H_pin);
      if (!H_master) {
        alert("Erreur de déchiffrement du master");
        setLogged(false);
        return;
      }

      globalThis.session_Hmaster = H_master;

      await setLastActive();
      onSuccess();
      return;
    }

    // MAUVAIS PIN
    await resetToMaster();
    setLogged(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {creating ? "Créer un code PIN" : "Entrer votre code PIN"}
      </Text>

      <View style={styles.dots}>
        {[0,1,2,3].map(i => (
          <View key={i} style={[styles.dot, { opacity: pin.length > i ? 1 : 0.2 }]} />
        ))}
      </View>

      <View style={styles.keypad}>
        {[1,2,3,4,5,6,7,8,9].map(n => (
          <TouchableOpacity key={n} style={styles.key} onPress={() => pressDigit(n.toString())}>
            <Text style={styles.keyText}>{n}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.key} onPress={() => setPin("")}>
          <Text style={styles.keyText}>C</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.key} onPress={() => pressDigit("0")}>
          <Text style={styles.keyText}>0</Text>
        </TouchableOpacity>

        <View style={styles.key}></View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 28,
    marginBottom: 40,
  },
  dots: {
    flexDirection: 'row',
    marginBottom: 50,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 10,
    backgroundColor: colors.primary,
    marginHorizontal: 10,
  },
  keypad: {
    width: '70%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  key: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    margin: '1.5%',
    borderRadius: 12,
  },
  keyText: {
    color: colors.text,
    fontSize: 26,
    fontWeight: 'bold',
  }
});

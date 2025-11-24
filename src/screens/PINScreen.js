// src/screens/PINScreen.js

import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Crypto from 'expo-crypto';

import colors from '../theme/colors';
import {
  getPinHash,
  increasePinAttempts,
  resetPinAttempts,
  getPinBlockUntil,
  setPinBlockUntil,
  resetEncryptedMasterKey
} from '../utils/SessionManager';

export default function PINScreen({ onSuccess, setLogged, navigation }) {

  const [pin, setPin] = useState('');
  const [storedHash, setStoredHash] = useState(null);
  const [blockedUntil, setBlockedUntil] = useState(0);

  const isBlocked = Date.now() < blockedUntil;

  useEffect(() => {
    (async () => {
      setStoredHash(await getPinHash());
      setBlockedUntil(await getPinBlockUntil());
    })();
  }, []);

  const pressDigit = async (d) => {
    if (isBlocked) return;

    const p = pin + d;
    setPin(p);

    if (p.length === 4) {
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        "VOLPINA_PIN" + p
      );

      // ✔ correct
      if (hash === storedHash) {
        await resetPinAttempts();
        onSuccess();
        return;
      }

      // ❌ wrong PIN
      const attempts = await increasePinAttempts();

      if (attempts === 3) await setPinBlockUntil(Date.now() + 60_000);
      if (attempts === 6) await setPinBlockUntil(Date.now() + 5 * 60_000);

      // reset encrypted master key → demande MDP
      await resetEncryptedMasterKey();
      setLogged(false);
    }
  };

  const erase = () => setPin("");

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Entrer votre PIN</Text>

      {isBlocked && (
        <Text style={styles.blockMsg}>Trop de tentatives. Réessaie plus tard.</Text>
      )}

      <View style={styles.dots}>
        {[0,1,2,3].map(i => (
          <View key={i} style={[styles.dot, {opacity: pin.length > i ? 1 : 0.2}]} />
        ))}
      </View>

      <View style={styles.keypad}>
        {["1","2","3","4","5","6","7","8","9"].map(n => (
          <TouchableOpacity key={n} style={styles.key} onPress={() => pressDigit(n)}>
            <Text style={styles.keyText}>{n}</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.key} onPress={erase}>
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
  container:{ flex:1,backgroundColor:colors.background,justifyContent:'center',alignItems:'center' },
  title:{ color:'white',fontSize:28,marginBottom:40 },
  blockMsg:{ color:'red',marginBottom:10 },
  dots:{ flexDirection:'row',marginBottom:40 },
  dot:{ width:18,height:18,borderRadius:10,backgroundColor:colors.primary,marginHorizontal:10 },
  keypad:{ width:'70%',flexDirection:'row',flexWrap:'wrap',justifyContent:'center' },
  key:{ width:'30%',aspectRatio:1,backgroundColor:'#1A1A1A',justifyContent:'center',alignItems:'center',margin:'1.5%',borderRadius:12 },
  keyText:{ color:'white',fontSize:26,fontWeight:'bold' }
});

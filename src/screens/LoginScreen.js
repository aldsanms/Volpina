// src/screens/LoginScreen.js

import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import colors from '../theme/colors';

import {
  saveMasterHash,
  getMasterHash,
  getEncryptedMasterKey,
  saveEncryptedMasterKey,
  increaseMDPAttempts,
  resetMDPAttempts,
  getMDPBlockUntil,
  setMDPBlockUntil,
  wipeEverything,
  createSession
} from '../utils/SessionManager';

import { generateMasterKey, encryptAES256GCM } from '../utils/cryptoUtils';

export default function LoginScreen({ onSuccess }) {

  const [password, setPassword] = useState("");
  const [masterHash, setMasterHash] = useState(null);
  const [blockedUntil, setBlockedUntil] = useState(0);
  const isBlocked = Date.now() < blockedUntil;

  useEffect(() => {
    (async () => {
      setMasterHash(await getMasterHash());
      setBlockedUntil(await getMDPBlockUntil());
    })();
  }, []);

  const handleLogin = async () => {
    if (isBlocked) {
      Alert.alert("Bloqué", "Trop de tentatives. Réessaye plus tard.");
      return;
    }

    // Calcul du hash avec le même salt qu'à l'enregistrement
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      "VOLPINA_MASTER_KEY" + password
    );

    // PREMIÈRE UTILISATION → création du mot de passe
    if (!masterHash) {
      const masterKey = await generateMasterKey();
      const encrypted = await encryptAES256GCM(password, masterKey);

      await saveMasterHash(hash);
      await saveEncryptedMasterKey(encrypted);
      await createSession();
      await resetMDPAttempts();

      onSuccess();
      return;
    }

    // MAUVAIS MOT DE PASSE
    if (hash !== masterHash) {
      const attempts = await increaseMDPAttempts();

      if (attempts === 3) await setMDPBlockUntil(Date.now() + 60_000);
      if (attempts === 6) await setMDPBlockUntil(Date.now() + 5 * 60_000);

      if (attempts >= 9) {
        await wipeEverything();
        Alert.alert("Sécurité", "Toutes les données ont été effacées après 9 tentatives.");
        return;
      }

      Alert.alert("Mot de passe incorrect", "Réessayez.");
      return;
    }

    // BON MOT DE PASSE
    let encryptedMasterKey = await getEncryptedMasterKey();
    if (!encryptedMasterKey) {
      const masterKey = await generateMasterKey();
      encryptedMasterKey = await encryptAES256GCM(password, masterKey);
      await saveEncryptedMasterKey(encryptedMasterKey);
    }

    await createSession();
    await resetMDPAttempts();

    onSuccess();
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Text style={styles.title}>Volpina</Text>
      <Text style={styles.subtitle}>
        {masterHash ? "Entrer votre mot de passe" : "Créer un mot de passe"}
      </Text>

      {isBlocked && <Text style={styles.blockMsg}>Trop de tentatives. Réessayez plus tard.</Text>}

      <TextInput
        secureTextEntry
        placeholder="Mot de passe"
        placeholderTextColor={colors.subtitle}
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        onSubmitEditing={handleLogin}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>{masterHash ? "Continuer" : "Créer"}</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1,backgroundColor:colors.background,justifyContent:'center',alignItems:'center' },
  title:{ color:'white',fontSize:38,fontWeight:'bold',marginBottom:10 },
  subtitle:{ color:colors.subtitle,fontSize:16,marginBottom:20 },
  blockMsg:{ color:'red',marginBottom:10 },
  input:{ width:'70%',padding:12,borderWidth:1,borderColor:'#444',borderRadius:10,color:'white',marginBottom:20 },
  button:{ backgroundColor:colors.primary,paddingVertical:12,paddingHorizontal:45,borderRadius:12 },
  buttonText:{ color:'white',fontSize:18 }
});

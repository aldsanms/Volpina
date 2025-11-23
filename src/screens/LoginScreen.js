import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import colors from '../theme/colors';
import { createSession } from '../utils/SessionManager';

export default function LoginScreen({ onSuccess }) {

  const [password, setPassword] = useState('');
  const [storedHash, setStoredHash] = useState(null);
  const [firstTime, setFirstTime] = useState(true);

  useEffect(() => {
    loadHash();
  }, []);

  const loadHash = async () => {
    const saved = await AsyncStorage.getItem('volpina_master_hash');
    if (saved) {
      setStoredHash(saved);
      setFirstTime(false);
    }
  };

    const handleLogin = async () => {
        const hash = await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            "VOLPINA_MASTER_KEY" + password
        );

        if (firstTime) {
            await AsyncStorage.setItem('volpina_master_hash', hash);
            await createSession();  
            onSuccess();
        } else {
            if (hash === storedHash) {
            await createSession(); 
            onSuccess();
            } else {
            alert("Mot de passe incorrect.");
            }
        }
    };


  return (
    <View style={styles.container}>

      <Image 
        source={require('../theme/volpina_logo.png')}
        style={styles.logo}
      />

      <Text style={styles.title}>Volpina</Text>
      <Text style={styles.subtitle}>
        {firstTime ? "Créer un mot de passe" : "Entrer votre mot de passe"}
      </Text>

      <TextInput
        secureTextEntry
        placeholder="Mot de passe"
        placeholderTextColor={colors.subtitle}
        style={styles.input}
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>
          {firstTime ? "Créer" : "Continuer"}
        </Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 38,
    color: colors.text,
    fontWeight: 'bold',
  },
  subtitle: {
    color: colors.subtitle,
    fontSize: 16,
    marginBottom: 20,
  },
  input: {
    width: '70%',
    padding: 12,
    borderWidth: 1,
    borderColor: colors.subtitle,
    borderRadius: 10,
    color: colors.text,
    marginBottom: 20,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 45,
    borderRadius: 12,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
  }
});

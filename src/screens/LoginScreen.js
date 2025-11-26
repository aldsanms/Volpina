import { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    Image, KeyboardAvoidingView, ScrollView, Platform, Keyboard
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import colors from '../theme/colors';
import { aesEncrypt, aesDecrypt } from '../utils/cryptoUtils';
import { createSession } from '../utils/SessionManager';

export default function LoginScreen({ onSuccess }) {

    const [password, setPassword] = useState('');
    const [firstTime, setFirstTime] = useState(true);

    useEffect(() => {
        loadHash();
    }, []);

    const loadHash = async () => {
        const testCipher = await AsyncStorage.getItem("volpina_test_cipher");
        console.log("LOADHASH → testCipher =", testCipher);
        if (testCipher) setFirstTime(false);
    };

    const handleLogin = async () => {

        Keyboard.dismiss();
        await new Promise(r => setTimeout(r, 50));

        if (!password) {
            console.log("handleLogin ignoré : mot de passe vide");
            return;
        }

        console.log("HANDLELOGIN OK");

        const H_master = await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            "VOLPINA_MASTER_KEY" + password
        );

        // -------- CREATION --------
        if (firstTime) {
            console.log("MODE CREATION MOT DE PASSE");

            const testCipher = aesEncrypt("VOLPINA_TEST_PHRASE", H_master);

            await AsyncStorage.setItem("volpina_test_cipher", testCipher);

            globalThis.session_Hmaster = H_master;

            console.log("LOGIN → Mot de passe créé → onSuccess('pin')");
            onSuccess("pin");
            return;
        }

        // -------- VERIFICATION --------

        console.log("MODE VERIFICATION MOT DE PASSE");

        const cipher = await AsyncStorage.getItem("volpina_test_cipher");

        if (!cipher) {
            alert("Erreur interne : testCipher inexistant");
            return;
        }

        const decrypted = aesDecrypt(cipher, H_master);
        console.log("DECRYPTED =", decrypted);

        if (decrypted === "VOLPINA_TEST_PHRASE") {
            console.log("MOT DE PASSE CORRECT → PIN");
            globalThis.session_Hmaster = H_master;
            await createSession();
            onSuccess("pin");
        } else {
            alert("Mot de passe incorrect");
        }
    };

    const resetApp = async () => {
        console.log("RESET APP !");
        await AsyncStorage.clear();

        // Supprime les fichiers locaux :
        const files = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory);
        for (const f of files) {
            await FileSystem.deleteAsync(FileSystem.documentDirectory + f, { idempotent: true });
        }

        globalThis.session_Hmaster = null;
        alert("Application réinitialisée !");
        setFirstTime(true);
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.container}>

                    <Image source={require('../theme/volpina_logo.png')} style={styles.logo} />

                    <Text style={styles.title}>Volpina</Text>

                    <Text style={styles.subtitle}>
                        {firstTime ? "Créer un mot de passe" : "Entrer votre mot de passe"}
                    </Text>

                    <TextInput
                        secureTextEntry
                        style={styles.input}
                        placeholder="Mot de passe"
                        placeholderTextColor={colors.subtitle}
                        value={password}
                        onChangeText={setPassword}
                        onSubmitEditing={handleLogin}
                    />

                    <TouchableOpacity style={styles.button} onPress={handleLogin}>
                        <Text style={styles.buttonText}>{firstTime ? "Créer" : "Continuer"}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: "#700", marginTop: 20 }]}
                        onPress={resetApp}
                    >
                        <Text style={styles.buttonText}>Réinitialiser l'application</Text>
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>

        </View>
    );
}

const styles = StyleSheet.create({
    container: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
    logo: { width: 120, height: 120, marginBottom: 20 },
    title: { fontSize: 38, fontWeight: 'bold', color: 'white' },
    subtitle: { color: colors.subtitle, marginBottom: 20 },
    input: {
        width: '75%', padding: 12, backgroundColor: '#111', color: 'white',
        borderRadius: 10, marginBottom: 20
    },
    button: { backgroundColor: colors.primary, paddingVertical: 12, paddingHorizontal: 45, borderRadius: 12 },
    buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});

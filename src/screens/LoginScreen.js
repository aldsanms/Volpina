import { useState, useEffect, useRef } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    Image, KeyboardAvoidingView, ScrollView, Platform, Keyboard, Animated
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as Haptics from 'expo-haptics';
import colors from '../theme/colors';
import { aesEncrypt, aesDecrypt } from '../utils/cryptoUtils';
import { createSession } from '../utils/SessionManager';
import securityConfig from '../config/securityConfig';

export default function LoginScreen({ onSuccess }) {

    const [password, setPassword] = useState('');
    const [firstTime, setFirstTime] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);

    const shakeAnim = useRef(new Animated.Value(0)).current;

    // Animation du champ en cas d’erreur
    function shake() {
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 12, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -12, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
    }

    useEffect(() => {
        loadHash();
    }, []);

    const loadHash = async () => {
        const testCipher = await AsyncStorage.getItem("volpina_test_cipher");
        if (testCipher) setFirstTime(false);
    };

    // --------- Bruteforce tracking ---------

    async function getLockData() {
        const fails = parseInt(await AsyncStorage.getItem("volpina_master_fails") || "0");
        const lockUntil = parseInt(await AsyncStorage.getItem("volpina_master_lock_until") || "0");
        return { fails, lockUntil };
    }

    async function setLockData(fails, minutes) {
        const until = Date.now() + minutes * 60000;
        await AsyncStorage.setItem("volpina_master_fails", fails.toString());
        await AsyncStorage.setItem("volpina_master_lock_until", until.toString());
    }

    // --------- Process Login ---------

    const handleLogin = async () => {

        Keyboard.dismiss();
        await new Promise(r => setTimeout(r, 50));

        if (!password) return;

        const { fails, lockUntil } = await getLockData();

        // Si l'app est bloquée
        if (Date.now() < lockUntil) {
            const secs = Math.ceil((lockUntil - Date.now()) / 1000);
            setErrorMsg(`Compte bloqué. Réessaie dans ${secs} sec.`);
            shake();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        const H_master = await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            "VOLPINA_MASTER_KEY" + password
        );

        // -------- Création du mot de passe --------
        if (firstTime) {

            const testCipher = aesEncrypt("VOLPINA_TEST_PHRASE", H_master);

            await AsyncStorage.setItem("volpina_test_cipher", testCipher);
            globalThis.session_Hmaster = H_master;

            onSuccess("pin");
            return;
        }

        // -------- Vérification --------

        const cipher = await AsyncStorage.getItem("volpina_test_cipher");
        if (!cipher) {
            alert("Erreur interne : testCipher inexistant");
            return;
        }

        const decrypted = aesDecrypt(cipher, H_master);

        // ------------------ CORRECT PASSWORD ------------------
        if (decrypted === "VOLPINA_TEST_PHRASE") {

            await AsyncStorage.removeItem("volpina_master_fails");
            await AsyncStorage.removeItem("volpina_master_lock_until");

            globalThis.session_Hmaster = H_master;
            await createSession();
            onSuccess("pin");
            return;
        }

        // ------------------ WRONG PASSWORD ------------------

        let newFails = fails + 1;

        // Erreur visible
        setErrorMsg("Mot de passe incorrect");
        shake();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

        // Blocages progressifs
        if (newFails === 3) {
            await setLockData(newFails, 1);
            return;
        }
        else if (newFails === 6) {
            await setLockData(newFails, 5);
            return;
        }
        else if (newFails === 9) {
            alert("Trop d'erreurs. L'application doit être réinitialisée.");
            await AsyncStorage.clear();
            globalThis.session_Hmaster = null;
            setFirstTime(true);
            return;
        }
        else {
            await AsyncStorage.setItem("volpina_master_fails", newFails.toString());
        }
    };

    // --------- Reset complet ---------

    const resetApp = async () => {
        await AsyncStorage.clear();

        const files = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory);
        for (const f of files) {
            await FileSystem.deleteAsync(FileSystem.documentDirectory + f, { idempotent: true });
        }

        globalThis.session_Hmaster = null;
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

                    <Animated.View style={{ width: "75%", transform: [{ translateX: shakeAnim }] }}>
                        <TextInput
                            secureTextEntry
                            style={styles.input}
                            placeholder="Mot de passe"
                            placeholderTextColor={colors.subtitle}
                            value={password}
                            onChangeText={(t) => { setPassword(t); setErrorMsg(null); }}
                            onSubmitEditing={handleLogin}
                        />
                    </Animated.View>

                    <View style={{
                        height: 28,
                        justifyContent: "center",
                        alignItems: "center",
                        marginBottom: 10
                    }}>
                        {errorMsg && (
                            <Text style={styles.error}>{errorMsg}</Text>
                        )}
                    </View>

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
        width: '100%',
        height: 50,
        paddingHorizontal: 12,
        backgroundColor: '#111',
        color: 'white',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#333",
        fontSize: 18,
    },



    error: {
        color: "#ff4d4d",
        fontSize: 15,
        fontWeight: "600",
    },


    button: {
        backgroundColor: colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 45,
        borderRadius: 12,
    },

    buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});

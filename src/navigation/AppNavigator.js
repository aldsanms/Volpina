import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppState } from 'react-native';

import LoginScreen from '../screens/LoginScreen';
import PINScreen from '../screens/PINScreen';
import TabNavigator from './TabNavigator';
import ScanConversation from '../screens/ScanConversation';
import MenuConv from '../screens/MenuConv';
import LockScreen from '../screens/LockScreen';
import ConversationViewScreen from '../screens/ConversationViewScreen';
import ShareConvScreen from '../screens/ShareConvScreen';
import EditConvScreen from '../screens/EditConvScreen';

import { getMasterHash, isSessionExpired } from '../utils/SessionManager';
import { useState, useEffect, useRef } from 'react';
import { View, Text } from 'react-native';
import colors from '../theme/colors';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {

  const [logged, setLogged] = useState(null);
  const [isLocked, setLocked] = useState(false);

  const navigationRef = useRef();

  // ─────────────────────────────────────────
  // 1) Initialisation + fonction triggerLock()
  // ─────────────────────────────────────────
  useEffect(() => {

    globalThis.triggerLock = () => {
      console.log("LOCK TRIGGERED");

      setLocked(true);   // affiche LockScreen
      setLogged("pin");  // demande de repasser par PIN

      setTimeout(() => {
        navigationRef.current?.navigate("PIN");
      }, 50);
    };

    checkState();
  }, []);

  // ─────────────────────────────────────────
  // 2) Détecter si l'app passe en arrière-plan
  // ─────────────────────────────────────────
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "background") {
        console.log("APP EN BACKGROUND → VERROUILLAGE");
        globalThis.triggerLock?.();
      }
    });

    return () => sub.remove();
  }, []);

  // ─────────────────────────────────────────
  // 3) Vérifier mot de passe + expiration session
  // ─────────────────────────────────────────
  async function checkState() {
    const hasMaster = await getMasterHash();
    if (!hasMaster) {
      setLogged(false);
      return;
    }

    const expired = await isSessionExpired(10);
    if (expired) {
      setLogged(false);
      return;
    }

    setLogged("pin");  // on demande PIN au démarrage
  }

  // ─────────────────────────────────────────
  // 4) Écran de chargement initial
  // ─────────────────────────────────────────
  if (logged === null) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background
      }}>
        <Text style={{ color: 'white', fontSize: 18 }}>Chargement…</Text>
      </View>
    );
  }

  // ─────────────────────────────────────────
  // 5) Navigation principale + LockScreen overlay
  // ─────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>

      {isLocked && (
        <LockScreen unlocked={() => setLocked(false)} />
      )}

      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>

          {/* LOGIN */}
          {logged === false && (
            <Stack.Screen name="Login">
              {() => <LoginScreen onSuccess={() => setLogged("pin")} />}
            </Stack.Screen>
          )}

          {/* PIN */}
          {logged === "pin" && (
            <Stack.Screen name="PIN">
              {() => (
                <PINScreen
                  onSuccess={() => setLogged("done")}
                  setLogged={setLogged}
                />
              )}
            </Stack.Screen>
          )}

          {/* APP */}
          {logged === "done" && (
            <>
              <Stack.Screen name="Main" component={TabNavigator} />
              <Stack.Screen name="MenuConv" component={MenuConv} />
              <Stack.Screen name="ScanConversation" component={ScanConversation} />
              <Stack.Screen name="ConversationView" component={ConversationViewScreen} />
              <Stack.Screen name="ShareConv" component={ShareConvScreen} />
              <Stack.Screen name="EditConv" component={EditConvScreen} />

              {/* PIN auxiliaire si besoin */}
              <Stack.Screen name="PINScreen">
                {() => (
                  <PINScreen
                    onSuccess={() => setLogged("done")}
                    setLogged={setLogged}
                  />
                )}
              </Stack.Screen>
            </>
          )}

        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
}

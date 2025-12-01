import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppState, View, Text } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { getLastActive, getSessionCreated, isSessionExpired } from '../utils/SessionManager';
import securityConfig from '../config/securityConfig';

import LoginScreen from '../screens/LoginScreen';
import PINScreen from '../screens/PINScreen';
import TabNavigator from './TabNavigator';
import LockScreen from '../screens/LockScreen';
import MenuConv from '../screens/MenuConv';
import ScanConversation from '../screens/ScanConversation';
import ConversationViewScreen from '../screens/ConversationViewScreen';
import ShareConvScreen from '../screens/ShareConvScreen';
import EditConvScreen from '../screens/EditConvScreen';

import colors from '../theme/colors';
import AsyncStorage from "@react-native-async-storage/async-storage";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {

  const [logged, setLogged] = useState(null);
  const [isLocked, setLocked] = useState(false);
  const navigationRef = useRef();

  useEffect(() => {
    globalThis.triggerLock = () => {
      console.log("LOCK TRIGGERED");
      setLocked(true);
      setLogged("pin");
    };

    checkState();
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "background") globalThis.triggerLock?.();
    });
    return () => sub.remove();
  }, []);

async function checkState() {
  console.log("checkState — début");

  const testCipher = await AsyncStorage.getItem("volpina_test_cipher");
  console.log("testCipher =", testCipher);

  if (!testCipher) {
    console.log("→ Aucun testCipher → setLogged(false)");
    setLogged(false);           
    return;
  }

  const sessionCreated = await getSessionCreated();
  const lastActive = await getLastActive();

    const MAX_MINUTES = securityConfig.SESSION_TIMEOUT_MINUTES;

  if (!sessionCreated || !lastActive) {
    console.log("→ Pas de session → demander mot de passe");
    setLogged(false);
    return;
  }

  const now = Date.now();
  const inactiveMs = now - lastActive;

  if (inactiveMs > MAX_MINUTES * 60000) {
    console.log("→ Session expirée : demander mot de passe maître");
    setLogged(false);              
    return;
  }

  console.log("→ Session valide → aller au PIN");
  setLogged("pin");
}


  if (logged === null) {
    return (
      <View style={{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor:colors.background }}>
        <Text style={{ color:"white" }}>Chargement…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {isLocked && <LockScreen unlocked={() => setLocked(false)} />}

      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator screenOptions={{ headerShown:false }}>

          {/* LOGIN → création du mot de passe */}
          {logged === false && (
            <Stack.Screen name="Login">
              {() => <LoginScreen onSuccess={(v)=> setLogged(v)} />}
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

          {/* APP COMPLÈTE */}
          {logged === "done" && (
            <>
              <Stack.Screen name="Main" component={TabNavigator} />
              <Stack.Screen name="MenuConv" component={MenuConv} />
              <Stack.Screen name="ScanConversation" component={ScanConversation} />
              <Stack.Screen name="ConversationView" component={ConversationViewScreen} />
              <Stack.Screen name="ShareConv" component={ShareConvScreen} />
              <Stack.Screen name="EditConv" component={EditConvScreen} />
            </>
          )}

        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
}

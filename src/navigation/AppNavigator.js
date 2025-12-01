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

  const [logged, setLogged] = useState(null);   // false = master password, "pin", "done"
  globalThis.setLogged = setLogged;
  globalThis.unlockApp = () => {
  setLogged("done");
  setAuthLocked(false);
};

  const [isLocked, setLocked] = useState(false);
  const [authLocked, setAuthLocked] = useState(true);   // empêche affichage des écrans Main
  const navigationRef = useRef();

  useEffect(() => {

    globalThis.triggerLock = () => {
  console.log("LOCK TRIGGERED");

  setAuthLocked(true);   // on verrouille la navigation
  setLogged("pin");      // le PIN devient l’écran courant
  setLocked(true);       // on affiche l’overlay LockScreen
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

  // 📌 Cas 1 : première installation → aucun master password
  if (!testCipher) {
    console.log("→ Aucun master → demande login");
    setLogged(false);
    setAuthLocked(true);
    return;
  }

  // 📌 Cas 2 : master existe → vérifier session
  const sessionCreated = await getSessionCreated();
  const lastActive      = await getLastActive();

  if (!sessionCreated || !lastActive) {
    console.log("→ Pas de session → demander master");
    setLogged(false);
    setAuthLocked(true);
    return;
  }

  const expired = await isSessionExpired(securityConfig.SESSION_TIMEOUT_MINUTES);

  if (expired) {
    console.log("→ Session expirée → demander master");
    setLogged(false);
    setAuthLocked(true);
    return;
  }

  // 📌 Cas 3 : session OK → charger automatiquement pinHash
  const storedPinHash = await AsyncStorage.getItem("volpina_pin_hash");

  if (!storedPinHash) {
    console.log("⚠️ SESSION OK mais pinHash absent → forcer écran PIN");
    setLogged("pin");
    setAuthLocked(true);
    return;
  }

  globalThis.session_pinHash = storedPinHash;

  console.log("→ Session valide → PIN");
  setLogged("pin");
  setAuthLocked(true);
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
      {isLocked && (
        <LockScreen
          unlocked={(state) => {
            console.log("LockScreen result =", state);

            if (state === "expired") {
              setLogged(false);    // MASTER
            } else {
              setLogged("pin");    // PIN
            }

            // IMPORTANT : on enlève LockScreen APRÈS avoir défini logged
            setTimeout(() => {
              setLocked(false);
            }, 1);
          }}
        />
      )}

      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator screenOptions={{ headerShown:false }}>

          {/*  AuthLocked → On ne montre que Login ou PIN */}
          {authLocked ? (
            <>
              {logged === false && (
                <Stack.Screen name="Login">
                  {() => (
                    <LoginScreen
                      onSuccess={(mode) => {
                        setLogged(mode);
                        // si mode = "pin", on reste authLocked = true
                      }}
                    />
                  )}
                </Stack.Screen>
              )}

              {logged === "pin" && (
                <Stack.Screen name="PIN">
                  {() => (
                    <PINScreen
                      onSuccess={() => {
                        setLogged("done");
                        setAuthLocked(false);   //  libère l’accès à Main
                      }}
                      setLogged={setLogged}
                    />
                  )}
                </Stack.Screen>
              )}
            </>
          ) : (
            <>
              {/*  App déverrouillée */}
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

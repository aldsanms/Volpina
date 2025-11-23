import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/LoginScreen';
import PINScreen from '../screens/PINScreen';
import TabNavigator from './TabNavigator';
import NewConversationScreen from '../screens/NewConversationScreen';
import ScanConversation from '../screens/ScanConversation';
import MenuConv from '../screens/MenuConv';
import LockScreen from '../screens/LockScreen';

import { getMasterHash, isSessionExpired } from '../utils/SessionManager';
import { useState, useEffect, useRef } from 'react';
import { View, Text } from 'react-native';
import colors from '../theme/colors';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {

  const [logged, setLogged] = useState(null);
  const [isLocked, setLocked] = useState(false);

  // ref navigation pour ouvrir PINScreen depuis triggerLock
  const navigationRef = useRef();

  // Au chargement
  useEffect(() => {

    globalThis.triggerLock = () => {
    setLogged("pin");
    setLocked(true);

    setTimeout(() => {
        navigationRef.current?.navigate("PIN"); 
    }, 50);
    };

    checkState();
  }, []);

  // Vérifie mdp + session
  async function checkState() {
    const hasMaster = await getMasterHash();
    if (!hasMaster) return setLogged(false);

    const expired = await isSessionExpired(10);
    if (expired) return setLogged(false);

    // Sinon PIN
    setLogged("pin");
  }

  // Chargement
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

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>

      {/*  Écran de verrouillage (overlay) */}
      {isLocked && (
        <LockScreen unlocked={() => setLocked(false)} />
      )}

      <NavigationContainer ref={navigationRef}>

        <Stack.Navigator screenOptions={{ headerShown: false }}>

          {/* ---------- LOGIN ---------- */}
          {logged === false && (
            <Stack.Screen name="Login">
              {() => (
                <LoginScreen onSuccess={() => setLogged("pin")} />
              )}
            </Stack.Screen>
          )}

          {/* ---------- PIN (premier lancement ou retour session) ---------- */}
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

          {/* ---------- APPLICATION ---------- */}
          {logged === "done" && (
            <>
              <Stack.Screen name="Main" component={TabNavigator} />
              <Stack.Screen name="MenuConv" component={MenuConv} />
              <Stack.Screen name="NewConversation" component={NewConversationScreen} />
              <Stack.Screen name="ScanConversation" component={ScanConversation} />

              {/*  PINScreen accessible même en mode "done" */}
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

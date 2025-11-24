// src/navigation/AppNavigator.js

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppState, View, Text } from 'react-native';
import { useState, useEffect, useRef } from 'react';

import LoginScreen from '../screens/LoginScreen';
import PINScreen from '../screens/PINScreen';
import TabNavigator from './TabNavigator';

import ScanConversation from '../screens/ScanConversation';
import MenuConv from '../screens/MenuConv';
import ConversationViewScreen from '../screens/ConversationViewScreen';
import ShareConvScreen from '../screens/ShareConvScreen';
import EditConvScreen from '../screens/EditConvScreen';

import { getMasterHash, getPinHash, isSessionExpired } from '../utils/SessionManager';
import colors from '../theme/colors';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {

  const [logged, setLogged] = useState(null);
  const navigationRef = useRef();

  useEffect(() => {

    globalThis.triggerLock = () => {
      console.log("🔒 TriggerLock()");
      setLogged("pin");
      setTimeout(() => {
        navigationRef.current?.navigate("PIN");
      }, 20);
    };

    checkState();

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "background") {
        globalThis.triggerLock();
      }
    });

    return () => sub.remove();

  }, []);

  async function checkState() {
    const hasMaster = await getMasterHash();
    const hasPIN = await getPinHash();

    if (!hasMaster || !hasPIN) {
      return setLogged(false);
    }

    const expired = await isSessionExpired(10);
    if (expired) return setLogged(false);

    setLogged("pin");
  }

  if (logged === null) {
    return (
      <View style={{
        flex:1,
        justifyContent:'center',
        alignItems:'center',
        backgroundColor:colors.background
      }}>
        <Text style={{color:'white',fontSize:18}}>Chargement…</Text>
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown:false }}>

        {logged === false && (
          <Stack.Screen name="Login">
            {() => (
              <LoginScreen onSuccess={() => setLogged("pin")} />
            )}
          </Stack.Screen>
        )}

        {logged === "pin" && (
          <Stack.Screen name="PIN">
            {({ navigation }) => (
              <PINScreen
                onSuccess={() => setLogged("done")}
                setLogged={setLogged}
                navigation={navigation}
              />
            )}
          </Stack.Screen>
        )}

        {logged === "done" && (
          <>
            <Stack.Screen name="Main">
              {() => <TabNavigator />}
            </Stack.Screen>

            <Stack.Screen name="MenuConv" component={MenuConv} />
            <Stack.Screen name="ScanConversation" component={ScanConversation} />
            <Stack.Screen name="ConversationView" component={ConversationViewScreen} />
            <Stack.Screen name="ShareConv" component={ShareConvScreen} />
            <Stack.Screen name="EditConv" component={EditConvScreen} />

            <Stack.Screen name="PINScreen">
              {({ navigation }) => (
                <PINScreen
                  onSuccess={() => setLogged("done")}
                  setLogged={setLogged}
                  navigation={navigation}
                />
              )}
            </Stack.Screen>
          </>
        )}

      </Stack.Navigator>
    </NavigationContainer>
  );
}

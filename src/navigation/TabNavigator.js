import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';

import ConversationsScreen from '../screens/ConversationsScreen';
import SettingsScreen from '../screens/SettingsScreen';

import useInactivityTimer from '../hooks/useInactivityTimer';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {

  const navigation = useNavigation();

  useInactivityTimer(() => {
    console.log("INACTIVITÉ → PIN");

    if (globalThis.triggerLock) {
      globalThis.triggerLock();  //  overlay LockScreen
    }

  }, 60000); 

  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Conversations" component={ConversationsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

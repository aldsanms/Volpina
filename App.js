import React from 'react';
import { View } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {

  const handleActivity = () => {
    if (globalThis.resetInactivity) {
      globalThis.resetInactivity();
    }
  };

  return (
    <View
      style={{ flex: 1 }}

      onStartShouldSetResponder={() => {
        handleActivity();
        return false;
      }}
      onMoveShouldSetResponder={() => {
        handleActivity();
        return false;
      }}
      onResponderGrant={handleActivity}
      onResponderStart={handleActivity}
      onTouchEnd={handleActivity}
    >
      <AppNavigator />
    </View>
  );
}

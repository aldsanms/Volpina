import { View, Text, StyleSheet, Image, Animated, PanResponder } from 'react-native';
import { useEffect, useState, useRef } from 'react';

export default function LockScreen({ unlocked }) {

  const messages = [
    "Tu es encore là ? 🦊",
    "Ça fait un moment que je ne t’ai pas vu…",
    "Je montais la garde ! 🔒",
    "Volpina protège tes secrets…",
    "Je t’attendais !",
    "Re-bonjour… c’est sécurisé maintenant.",
    "Promis, je n'ai rien regardé 👀",
    "Tu te caches de moi ?",
    "On reprend là où on s’était arrêté ?",
  ];

  const [message, setMessage] = useState("");

  useEffect(() => {
    const random = Math.floor(Math.random() * messages.length);
    setMessage(messages[random]);
  }, []);

  const translateY = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 10,

      onPanResponderMove: (_, g) => {
        if (g.dy < 0) translateY.setValue(g.dy);
      },

      onPanResponderRelease: (_, g) => {
        if (g.dy < -120) {
          Animated.parallel([
            Animated.timing(translateY, {
              toValue: -1200,
              duration: 250,
              useNativeDriver: true,
            }),
            Animated.timing(fade, {
              toValue: 0,
              duration: 250,
              useNativeDriver: true,
            })
          ]).start(() => unlocked());
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start(() => {
            fade.setValue(1);
          });
        }
      }
    })
  ).current;

  //  Opacité dynamique liée au scroll
  const dragOpacity = translateY.interpolate({
    inputRange: [-250, 0],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity: Animated.multiply(dragOpacity, fade)  //  combine fade + scroll
        }
      ]}
    >
      <View style={styles.blackBg} />

      <Image 
        source={require('../theme/volpina_logo.png')}
        style={styles.logo}
      />

      <Text style={styles.message}>{message}</Text>
      <Text style={styles.arrow}>⌃</Text>
      <Text style={styles.sub}>Glissez vers le haut pour déverrouiller</Text>

    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container:{
    position:"absolute",
    top:0,left:0,right:0,bottom:0,
    justifyContent:"center",
    alignItems:"center",
    zIndex:9999,
  },

  blackBg:{
    position:"absolute",
    top:0,left:0,right:0,bottom:0,
    backgroundColor:"#000",
    zIndex:-1,
  },

  logo:{
    width:120,
    height:120,
    marginBottom:30,
  },

  message:{
    color:'white',
    fontSize:22,
    marginBottom:20,
    textAlign:'center',
    paddingHorizontal:20,
  },

  arrow:{
    fontSize:55,
    color:"#777",
    marginTop:40,
    marginBottom:5,
  },

  sub:{
    color:"#888",
    fontSize:18,
  }
});

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import colors from '../theme/colors';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system/legacy';

export default function ShareConvScreen() {

  const route = useRoute();
  const navigation = useNavigation();
  const { convId } = route.params;

  const [convData, setConvData] = useState(null);

  useEffect(() => {
    loadConvData();
  }, []);

  const loadConvData = async () => {

    const path = FileSystem.documentDirectory + "conversations.json";

    try {
      const raw = await FileSystem.readAsStringAsync(path);
      const json = JSON.parse(raw);

      const conv = json.find(c => c.id === convId);

      if (conv) {
        setConvData({
          id: convId,
          key: conv.key
        });
      }

    } catch (e) {
      console.log("Erreur lecture conversations.json", e);
    }
  };

  if (!convData) {
    return (
      <View style={styles.container}>
        <Text style={{color:"white"}}>Chargement…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      <Text style={styles.title}>Partager la conversation</Text>
      <Text style={styles.subtitle}>Scannez ce code sur un autre appareil</Text>

      <View style={styles.qrWrapper}>
        <QRCode
          value={JSON.stringify(convData)}
          size={240}
          color="white"
          backgroundColor="black"
        />
      </View>

      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backText}>Retour</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container:{
    flex:1,
    backgroundColor:colors.background,
    justifyContent:"center",
    alignItems:"center",
    padding:20
  },

  title:{
    color:"white",
    fontSize:24,
    marginBottom:10,
    fontWeight:"bold"
  },

  subtitle:{
    color:colors.subtitle,
    fontSize:16,
    marginBottom:30
  },

  qrWrapper:{
    padding:20,
    backgroundColor:"#000",
    borderRadius:20,
    marginBottom:40,
    borderWidth:1,
    borderColor:"#333"
  },

  backButton:{
    backgroundColor:colors.primary,
    paddingVertical:15,
    paddingHorizontal:50,
    borderRadius:12
  },

  backText:{
    color:"white",
    fontSize:18,
    fontWeight:"bold"
  }
});

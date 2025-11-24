import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system/legacy';
import colors from '../theme/colors';

export default function ConversationViewScreen() {

  const navigation = useNavigation();
  const route = useRoute();
  const { convId } = route.params;

  const [messages, setMessages] = useState([]);
  const [convName, setConvName] = useState("Conversation");

    useFocusEffect(
    useCallback(() => {
        loadConvInfo();
        loadMessages();
    }, [])
    );

  // Charger le nom de la conversation
  async function loadConvInfo() {
    const path = FileSystem.documentDirectory + "conversations.json";

    try {
      const raw = await FileSystem.readAsStringAsync(path);
      const list = JSON.parse(raw);

      const conv = list.find(c => c.id === convId);
      if (conv) setConvName(conv.name);

    } catch (e) {
      console.log("Erreur lecture conv info :", e);
    }
  }

  async function loadMessages() {
    const path = FileSystem.documentDirectory + `conv_${convId}.json`;

    try {
      const raw = await FileSystem.readAsStringAsync(path);
      const json = JSON.parse(raw);

      setMessages(json.messages || []);
    } catch (e) {
      console.log("Erreur lecture messages :", e);
      setMessages([]);
    }
  }

  const renderItem = ({ item }) => (
    <View style={styles.messageBubble}>
      <Text style={styles.msgText}>{item.text}</Text>
    </View>
  );

  return (
    <View style={styles.container}>

      {/* ───────── TOP BAR ───────── */}
      <View style={styles.header}>

        <TouchableOpacity onPress={() => navigation.navigate("Main")}>
          <Text style={styles.back}>‹ Retour</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{convName}</Text>

        <View style={styles.rightButtons}>

          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => navigation.navigate("EditConv", { convId })}
          >
            <Text style={styles.headerBtnText}>⋯</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => navigation.navigate("ShareConv", { convId })}
          >
            <Text style={styles.headerBtnText}>QR</Text>
          </TouchableOpacity>

        </View>

      </View>

      {/* ───────── MESSAGES ───────── */}
      {messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Aucun message pour le moment…</Text>
        </View>
      ) : (
        <FlatList
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        />
      )}

      {/* ───────── INPUT FUTUR ───────── */}
      <View style={styles.inputBar}>
        <Text style={{ color: "#555" }}>Barre d’écriture (à venir)</Text>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container:{
    flex:1,
    backgroundColor:colors.background,
  },

  header:{
    flexDirection:"row",
    alignItems:"center",
    justifyContent:"space-between",
    padding:15,
    paddingTop:50,
    borderBottomWidth:1,
    borderBottomColor:"#222",
  },

  back:{
    color:colors.subtitle,
    fontSize:16,
  },

  title:{
    color:"white",
    fontSize:20,
    fontWeight:"bold",
    maxWidth: 180,
    textAlign: "center",
  },

  rightButtons:{
    flexDirection:"row",
    alignItems:"center",
  },

  headerBtn:{
    marginLeft:10,
    paddingHorizontal:10,
    paddingVertical:4,
    backgroundColor:"#333",
    borderRadius:8,
  },

  headerBtnText:{
    color:"white",
    fontSize:14,
  },

  emptyContainer:{
    flex:1,
    justifyContent:"center",
    alignItems:"center",
  },

  emptyText:{
    color:"#666",
    fontSize:16,
  },

  messageBubble:{
    backgroundColor:"#1A1A1A",
    padding:12,
    borderRadius:10,
    marginBottom:10,
  },

  msgText:{
    color:"white",
    fontSize:16,
  },

  inputBar:{
    borderTopWidth:1,
    borderTopColor:"#222",
    padding:15,
    alignItems:"center",
  },
});

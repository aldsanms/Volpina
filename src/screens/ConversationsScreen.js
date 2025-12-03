import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system/legacy';
import colors from '../theme/colors';
import { decryptConvFields } from "../utils/ConversationCrypto";


export default function ConversationsScreen() {

  const navigation = useNavigation();
  const [conversations, setConversations] = useState([]);

  // ────────────────────────────────────────────────
  // Lire le dernier message d’une conversation
  // ────────────────────────────────────────────────
  async function getLastMessage(convId) {
    try {
      const path = FileSystem.documentDirectory + `conv_${convId}.json`;
      const raw = await FileSystem.readAsStringAsync(path);
      const json = JSON.parse(raw);

      if (json.messages && json.messages.length > 0) {
        const last = json.messages[json.messages.length - 1];
        return last.text;
      }
    } catch (_) {}

    return null;
  }

  // ────────────────────────────────────────────────
  // Charger toutes les conversations + enrichir avec le dernier message
  // ────────────────────────────────────────────────
  async function loadConversations() {
    const path = FileSystem.documentDirectory + "conversations.json";

    try {
      const raw = await FileSystem.readAsStringAsync(path);
      const data = JSON.parse(raw); // tableau brut

      const H_master = globalThis.session_Hmaster;
const decryptedList = data.map(c => decryptConvFields(c, H_master));


      const enriched = [];

      for (const conv of decryptedList){

        const last = await getLastMessage(conv.id);
        enriched.push({
          ...conv,
          lastMessage: last,
        });
      }

      setConversations(enriched);
    } catch (e) {
      console.log("Aucune conversation enregistrée.");
      setConversations([]);
    }
  }

  // Refresh à chaque fois qu’on revient sur cette page
  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [])
  );

  // ────────────────────────────────────────────────
  // Ouvrir une conversation
  // ────────────────────────────────────────────────
  const openConversation = (item) => {
    navigation.navigate("ConversationView", { convId: item.id });
  };

  // ────────────────────────────────────────────────
  // Une conversation dans la liste
  // ────────────────────────────────────────────────
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.convCard}
      onPress={() => openConversation(item)}
      onLongPress={() => navigation.navigate("EditConv", { convId: item.id })}
      delayLongPress={300}
    >
      <View style={styles.convLeft}>
        <View style={styles.avatar} />
        <View>
          <Text style={styles.name}>{item.name}</Text>

          <Text style={styles.msg}>
            {item.lastMessage ? item.lastMessage : "Aucun message…"}
          </Text>
        </View>
      </View>

      <Text style={styles.time}>
        {item.lastTime ? item.lastTime : ""}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>

      {/* ─────── TOP BAR ─────── */}
      <View style={styles.topBar}>
        <Image 
          source={require('../theme/volpina_logo.png')}
          style={styles.logo}
        />
        <Text style={styles.title}>Volpina</Text>
      </View>

      {/* ─────── LISTE DES CONVERSATIONS ─────── */}
        <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, padding: 20, paddingBottom: 140 }}
        ListEmptyComponent={() => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>Aucune conversation pour le moment</Text>
            <Text style={styles.emptySubtitle}>Appuie sur + pour en créer une 🦊</Text>
        </View>
        )}

        />

      {/* ─────── BOUTON AJOUT ─────── */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.getParent().navigate("MenuConv")}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // ───────── TOP BAR ─────────
  topBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 5,
    paddingBottom: 10,
    borderBottomColor: '#222',
    borderBottomWidth: 1,
  },

  logo: {
    width: 28,
    height: 28,
    marginRight: 12,
  },

  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 1,
  },

  // ───────── CONV CARD ─────────
  convCard: {
    backgroundColor: '#1A1A1A',
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  convLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    width: 45,
    height: 45,
    borderRadius: 25,
    backgroundColor: colors.primary,
    marginRight: 15,
  },

  name: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
  },

  msg: {
    color: colors.subtitle,
    fontSize: 14,
    marginTop: 3,
  },

  time: {
    color: colors.subtitle,
    fontSize: 12,
  },

  // ───────── FLOATING BUTTON ─────────
  fab: {
    position: 'absolute',
    bottom: 25,
    right: 25,
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
  },

  fabText: {
    color: 'white',
    fontSize: 30,
    fontWeight: 'bold',
    marginTop: -2,
  },

  // ───────── FlatList ─────────
    emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
    marginTop: -50,
    },

    emptyTitle: {
    color: "white",
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
    },

    emptySubtitle: {
    color: colors.subtitle,
    fontSize: 16,
    textAlign: "center",
    opacity: 0.75,
    },


});

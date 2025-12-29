import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import * as FileSystem from "expo-file-system/legacy";
import colors from "../theme/colors";
import { decryptConvFields } from "../utils/ConversationCrypto";
import { fetchLastTimes } from "../api/api";

export default function ConversationsScreen() {
  const navigation = useNavigation();
  const [conversations, setConversations] = useState([]);

  // ────────────────────────────────────────────────
  // Charger les conversations (LOCAL + BDD)
  // ────────────────────────────────────────────────
  async function loadConversations() {
    try {
      // Charger les conversations locales (id + name)
      const path = FileSystem.documentDirectory + "conversations.json";
      const raw = await FileSystem.readAsStringAsync(path);
      const localList = JSON.parse(raw);

      if (!Array.isArray(localList) || localList.length === 0) {
        setConversations([]);
        return;
      }

      const H_master = globalThis.session_Hmaster;
      const decrypted = localList.map(c =>
        decryptConvFields(c, H_master)
      );

      // Envoyer TOUS les conv_id au backend
      const convIds = decrypted.map(c => c.id);
      const remote = await fetchLastTimes(convIds);
      // remote = [{ conv_id, last_time }]

      // Merge local + backend
      const merged = decrypted.map(conv => {
        const match = remote.find(r => r.conv_id === conv.id);

        return {
          id: conv.id,
          name: conv.name,
          lastTime: match?.last_time ?? null,
        };
      });

      // Tri par activité (sécurité côté front)
      merged.sort((a, b) => (b.lastTime ?? 0) - (a.lastTime ?? 0));

      setConversations(merged);
    } catch (e) {
      console.log("Aucune conversation");
      setConversations([]);
    }
  }

  // Reload quand on revient sur l’écran
  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [])
  );

  // ────────────────────────────────────────────────
  // Utils
  // ────────────────────────────────────────────────
function formatLastTime(ts) {
  if (!ts) return "";

  const d = new Date(Number(ts));
  if (isNaN(d.getTime())) return "";

  const now = new Date();

  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const msgDay = new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate()
  );

  // Aujourd’hui → heure
  if (msgDay.getTime() === today.getTime()) {
    return d.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // Hier
  if (msgDay.getTime() === yesterday.getTime()) {
    return "Hier";
  }

  // Plus ancien → date
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}


  const openConversation = item => {
    navigation.navigate("ConversationView", { convId: item.id });
  };

  // ────────────────────────────────────────────────
  // Render item
  // ────────────────────────────────────────────────
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.convCard}
      onPress={() => openConversation(item)}
      onLongPress={() =>
        navigation.navigate("EditConv", { convId: item.id })
      }
      delayLongPress={300}
    >
      <View style={styles.convLeft}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.name?.charAt(0).toUpperCase()}
          </Text>
        </View>

        <Text style={styles.name}>{item.name}</Text>
      </View>

      <Text style={styles.time}>{formatLastTime(item.lastTime)}</Text>

    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* TOP BAR */}
      <View style={styles.topBar}>
        <Image
          source={require("../theme/volpina_logo.png")}
          style={styles.logo}
        />
        <Text style={styles.title}>Volpina</Text>
      </View>

      {/* LISTE DES CONVERSATIONS */}
      <FlatList
        data={conversations}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{
          flexGrow: 1,
          padding: 20,
          paddingBottom: 140,
        }}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>
              Aucune conversation pour le moment
            </Text>
            <Text style={styles.emptySubtitle}>
              Appuie sur + pour en créer une 🦊
            </Text>
          </View>
        )}
      />

      {/* FAB */}
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
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 5,
    paddingBottom: 10,
    borderBottomColor: "#222",
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
    fontWeight: "700",
    letterSpacing: 1,
  },

  // ───────── CONV CARD ─────────
  convCard: {
    backgroundColor: "#1A1A1A",
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  convLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 45,
    height: 45,
    borderRadius: 25,
    backgroundColor: colors.primary,
    marginRight: 15,
    justifyContent: "center",
    alignItems: "center",
  },

  avatarText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },

  name: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "600",
  },

  time: {
    color: colors.subtitle,
    fontSize: 12,
  },

  // ───────── FAB ─────────
  fab: {
    position: "absolute",
    bottom: 25,
    right: 25,
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 10,
  },

  fabText: {
    color: "white",
    fontSize: 30,
    fontWeight: "bold",
    marginTop: -2,
  },

  // ───────── EMPTY ─────────
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

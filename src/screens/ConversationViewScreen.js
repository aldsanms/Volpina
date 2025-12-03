import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Keyboard,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system/legacy';
import colors from '../theme/colors';
import { decryptConvFields } from "../utils/ConversationCrypto";
import { fetchMessages, sendMessage } from "../api/api";

export default function ConversationViewScreen() {

  const navigation = useNavigation();
  const route = useRoute();
  const { convId } = route.params;

  const [messages, setMessages] = useState([]);
  const [convName, setConvName] = useState("Conversation");
  const [inputText, setInputText] = useState("");
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const listRef = useRef(null);

  // Position et etat du scroll
  const scrollOffsetRef = useRef(0);
  const isUserAtBottomRef = useRef(true);

  // Sauvegarde pour restaurer la position apres fermeture clavier
  const restoreOffsetRef = useRef(0);

  // ----------- SCROLL TOUT EN BAS ----------- //
  function scrollToBottom() {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: false });

      setTimeout(() => {
        listRef.current?.scrollToOffset({
          offset: 2000,
          animated: true
        });
      }, 20);
    });
  }

  // ----------- KEYBOARD EVENTS ----------- //
  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", (e) => {
      const kHeight = e.endCoordinates.height;
      setKeyboardHeight(kHeight);

      // On sauvegarde la position EXACTE pour la restaurer ensuite
      restoreOffsetRef.current = scrollOffsetRef.current;

      if (isUserAtBottomRef.current) {
        scrollToBottom(); // comportement normal
      } else {
        // NO SCROLL -> on reste la ou on etait
        setTimeout(() => {
          listRef.current?.scrollToOffset({
            offset: scrollOffsetRef.current + kHeight,
            animated: true
          });
        }, 20);
      }
    });

    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);

      if (isUserAtBottomRef.current) {
        scrollToBottom();
      } else {
        // on restaure EXACTEMENT la position avant ouverture clavier
        setTimeout(() => {
          listRef.current?.scrollToOffset({
            offset: restoreOffsetRef.current,
            animated: false
          });
        }, 20);
      }
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // ----------- CHARGEMENT DES INFOS ----------- //
  useFocusEffect(
    useCallback(() => {
      loadConvInfo();
      loadMessages();
    }, [])
  );

  async function loadConvInfo() {
    try {
      const raw = await FileSystem.readAsStringAsync(
        FileSystem.documentDirectory + "conversations.json"
      );
      const list = JSON.parse(raw);
      const conv = list.find(c => c.id === convId);

      if (conv) {
        const dec = decryptConvFields(conv, globalThis.session_Hmaster);
        setConvName(dec.name);
      }
    } catch {}
  }

  async function loadMessages() {
    const msgs = await fetchMessages(convId);
    setMessages(msgs);

    // Scroll initial parfait
    setTimeout(scrollToBottom, 10);
  }

  const renderItem = ({ item }) => (
    <View style={styles.messageBubble}>
      <Text style={styles.msgText}>{item.text}</Text>
    </View>
  );

  // ----------- RENDER ----------- //
  return (
    <View style={styles.screen}>

      {/* ───── HEADER FIXE ───── */}
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

      {/* ───── LISTE + INPUT ───── */}
      <View style={styles.content}>

        <FlatList
          ref={listRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}

          contentContainerStyle={{
            padding: 20,
            paddingBottom: keyboardHeight + 100,
          }}

          onScroll={(e) => {
            const offset = e.nativeEvent.contentOffset.y;
            scrollOffsetRef.current = offset;

            const contentHeight = e.nativeEvent.contentSize.height;
            const viewHeight = e.nativeEvent.layoutMeasurement.height;

            const bottomGap = contentHeight - viewHeight - offset;
            isUserAtBottomRef.current = bottomGap < 20;
          }}

          onContentSizeChange={() => {
            if (isUserAtBottomRef.current) scrollToBottom();
          }}
        />

        {/* ───── BARRE D ENVOI ───── */}
        <View style={[styles.sendBar, { marginBottom: keyboardHeight }]}>
          <TextInput
            style={styles.textInput}
            placeholder="Écrire un message…"
            placeholderTextColor="#666"
            value={inputText}
            onChangeText={setInputText}
          />

          <TouchableOpacity
            style={styles.sendButton}
            onPress={async () => {
              if (!inputText.trim()) return;

              const ok = await sendMessage(convId, inputText, "me");
              if (ok) {
                setInputText("");
                loadMessages();
              }
            }}
          >
            <Text style={styles.sendButtonText}>Envoyer</Text>
          </TouchableOpacity>
        </View>

      </View>

    </View>
  );
}

const styles = StyleSheet.create({

  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  /* HEADER FIXE */
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 110,
    paddingTop: 50,
    paddingHorizontal: 15,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 9999,
  },

  back: { color: colors.subtitle, fontSize: 16 },
  title: { color: "white", fontSize: 20, fontWeight: "bold" },

  rightButtons: { flexDirection: "row" },

  headerBtn: {
    marginLeft: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#333",
    borderRadius: 8,
  },

  headerBtnText: { color: "white" },

  /* CONTENU */
  content: {
    flex: 1,
    paddingTop: 110,
  },

  messageBubble: {
    backgroundColor: "#1A1A1A",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },

  msgText: { color: "white" },

  /* INPUT BAR */
  sendBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
    padding: 10,
    paddingBottom: 25,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: "#222",
    flexDirection: "row",
    alignItems: "center",
  },

  textInput: {
    flex: 1,
    backgroundColor: "#111",
    padding: 12,
    color: "white",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#333",
    marginRight: 10,
    fontSize: 16,
  },

  sendButton: {
    backgroundColor: "#3366FF",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
  },

  sendButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },

});

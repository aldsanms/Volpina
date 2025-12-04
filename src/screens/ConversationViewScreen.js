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
import { generatePseudo } from "../utils/pseudoUtils";

export default function ConversationViewScreen() {

  const navigation = useNavigation();
  const route = useRoute();
  const { convId } = route.params;

  // Messages + conv info
  const [messages, setMessages] = useState([]);
  const [convName, setConvName] = useState("Conversation");
  const [inputText, setInputText] = useState("");

  // Keyboard
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Scroll refs
  const listRef = useRef(null);
  const scrollOffsetRef = useRef(0);
  const isUserAtBottomRef = useRef(true);
  const restoreOffsetRef = useRef(0);

  // Pseudos mapping
  const [userMap, setUserMap] = useState({});
  const usersPath = FileSystem.documentDirectory + `users_${convId}.json`;

  const myId = useRef(null); // idPerso local (sender)

  // ────────────────────────────────────────────
  //  Charger la map pseudo locale
  // ────────────────────────────────────────────
  async function loadUserMap() {
    try {
      const raw = await FileSystem.readAsStringAsync(usersPath);
      setUserMap(JSON.parse(raw));
    } catch {
      setUserMap({});
    }
  }

  // ────────────────────────────────────────────
  //     GET PSEUDO (stable, stocké en JSON)
  // ────────────────────────────────────────────
  function getPseudo(senderId) {
    if (senderId === myId.current) return "Moi";

    if (!userMap[senderId]) {
      // Génère un pseudo unique
      const newPseudo = generatePseudo(Object.values(userMap));
      const updated = { ...userMap, [senderId]: newPseudo };

      setUserMap(updated);
      FileSystem.writeAsStringAsync(usersPath, JSON.stringify(updated));

      return newPseudo;
    }
    return userMap[senderId];
  }

  // ────────────────────────────────────────────
  //                 SCROLL TO BOTTOM
  // ────────────────────────────────────────────
  function scrollToBottom() {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: false });
      setTimeout(() => {
        listRef.current?.scrollToOffset({
          offset: 2000,
          animated: true,
        });
      }, 20);
    });
  }

  // ────────────────────────────────────────────
  //              KEYBOARD EVENTS
  // ────────────────────────────────────────────
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

  // ────────────────────────────────────────────
  //      LOAD CONV INFO + messages + users map
  // ────────────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      loadConvInfo();
      loadMessages();
      loadUserMap();
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
        myId.current = dec.idPerso;  // <-- important
      }
    } catch {}
  }

  async function loadMessages() {
    const msgs = await fetchMessages(convId);
    setMessages(msgs);
    setTimeout(scrollToBottom, 10);
  }

  // ────────────────────────────────────────────
  //               FORMAT HEURE
  // ────────────────────────────────────────────
  function formatTime(ts) {
    const d = new Date(Number(ts));
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }

  // ────────────────────────────────────────────
  //                 RENDER ITEM
  // ────────────────────────────────────────────
const renderItem = ({ item }) => {
  const isMe = item.sender === myId.current;
  const pseudo = getPseudo(item.sender);
  const time = formatTime(item.timestamp);

  return (
    <View style={[
      styles.row,
      isMe ? styles.rowMe : styles.rowOther
    ]}>

      {/* Heure côté gauche pour les autres */}
      {isMe && (
        <Text style={[styles.timeSide, styles.timeRight]}>
          {time}
        </Text>
      )}

      <View style={styles.column}>
        {!isMe && (
          <Text style={styles.pseudo}>{pseudo}</Text>
        )}

        <View style={[
          styles.bubble,
          isMe ? styles.myBubble : styles.otherBubble
        ]}>
          <Text style={styles.msgText}>{item.text}</Text>
        </View>
      </View>

      {/* Heure côté droit pour moi */}
      {!isMe && (
        <Text style={[styles.timeSide, styles.timeLeft]}>
          {time}
        </Text>
      )}

    </View>
  );
};



  // ────────────────────────────────────────────
  //                     RENDER
  // ────────────────────────────────────────────
  return (
    <View style={styles.screen}>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate("Main")}>
          <Text style={styles.back}>‹ Retour</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{convName}</Text>

        <View style={styles.rightButtons}>
          <TouchableOpacity style={styles.headerBtn}
            onPress={() => navigation.navigate("EditConv", { convId })}
          >
            <Text style={styles.headerBtnText}>⋯</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.headerBtn}
            onPress={() => navigation.navigate("ShareConv", { convId })}
          >
            <Text style={styles.headerBtnText}>QR</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* CONTENT */}
      <View style={styles.content}>
        <FlatList
          ref={listRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
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

        {/* SEND BAR */}
        <View style={[styles.sendBar, { marginBottom: keyboardHeight }]}>
          <TextInput
            style={styles.textInput}
            placeholder="Écrire un message…"
            placeholderTextColor={colors.subtitle}
            value={inputText}
            onChangeText={setInputText}
          />

          <TouchableOpacity
            style={styles.sendButton}
            onPress={async () => {
              if (!inputText.trim()) return;

              const ok = await sendMessage(convId, inputText, myId.current);

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

  /* ÉCRAN */
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  /* HEADER */
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
    borderBottomColor: colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 9999,
  },

  back: {
    color: colors.subtitle,
    fontSize: 16
  },

  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "bold"
  },

  rightButtons: {
    flexDirection: "row"
  },

  headerBtn: {
    marginLeft: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: colors.backgroundLight,
    borderRadius: 8,
  },

  headerBtnText: {
    color: colors.text,
  },

  /* CONTENU LISTE */
  content: {
    flex: 1,
    paddingTop: 110,
  },

  /* ALIGNEMENT DES MESSAGES */
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
    maxWidth: "100%",
    paddingHorizontal: 0,
  },

  rowMe: {
    justifyContent: "flex-end",
  },

  rowOther: {
    justifyContent: "flex-start",
  },

  column: {
    maxWidth: "75%",
  },

  /* PSEUDO AU-DESSUS DE LA BULLE DES AUTRES */
  pseudo: {
    color: colors.subtitle,
    fontSize: 13,
    marginBottom: 2,
    marginLeft: 4,
  },

  /* BULLES */
  bubble: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
  },

  // Bulle du user local
  myBubble: {
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)", // contour léger
    borderTopRightRadius: 4,
    marginRight: -5,
  },

  // Bulle des autres
  otherBubble: {
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)", // contour léger
    borderTopLeftRadius: 4,
    marginLeft: -5,
  },

  msgText: {
    color: colors.text,
    fontSize: 16,
  },

  /* HEURE SUR LE CÔTÉ */
  timeSide: {
    fontSize: 12,
    color: colors.subtitle,
    marginHorizontal: 6,
    marginTop: 4,
  },

  timeLeft: {
    alignSelf: "flex-end",
  },

  timeRight: {
    alignSelf: "flex-end",
  },

  /* BARRE D’ENVOI */
  sendBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    padding: 10,
    paddingBottom: 25,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
  },

  textInput: {
    flex: 1,
    backgroundColor: "#111",
    padding: 12,
    color: colors.text,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 10,
    fontSize: 16,
  },

  sendButton: {
    backgroundColor: colors.sendButton,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
  },

  sendButtonText: {
    color: colors.text,
    fontWeight: "bold",
    fontSize: 16,
  },

});

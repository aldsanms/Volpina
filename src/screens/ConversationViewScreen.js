import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Keyboard,
  Image,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system/legacy';
import colors from '../theme/colors';
import { decryptConvFields } from "../utils/ConversationCrypto";
import { fetchMessages, sendMessage, saveMessage, unsaveMessage, deleteMessage } from "../api/api";

export default function ConversationViewScreen() {

  const navigation = useNavigation();
  const route = useRoute();
  const { convId } = route.params;

  const [messages, setMessages] = useState([]);
  const [convName, setConvName] = useState("Conversation");
  const [inputText, setInputText] = useState("");

  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const listRef = useRef(null);
  const scrollOffsetRef = useRef(0);
  const isUserAtBottomRef = useRef(true);
  const restoreOffsetRef = useRef(0);

  const [userMap, setUserMap] = useState({});
  const [userMapReady, setUserMapReady] = useState(false);

  const usersPath = FileSystem.documentDirectory + `users_${convId}.json`;
  const myId = useRef(null);

  // MENU LONG PRESS
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);

  //──────────────── USER MAP
  async function loadUserMap() {
    try {
      const raw = await FileSystem.readAsStringAsync(usersPath);
      setUserMap(JSON.parse(raw));
    } catch {
      setUserMap({});
    }
    setUserMapReady(true);
  }

  function getPseudo(senderId) {
    if (senderId === myId.current) return "Moi";
    return userMap[senderId] || "Inconnu";
  }

  //──────────────── SCROLL
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

  //──────────────── KEYBOARD
  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", (e) => {
      const kHeight = e.endCoordinates.height;
      setKeyboardHeight(kHeight);
      restoreOffsetRef.current = scrollOffsetRef.current;

      if (isUserAtBottomRef.current) scrollToBottom();
      else {
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

      if (isUserAtBottomRef.current) scrollToBottom();
      else {
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

  //──────────────── LOAD
  useFocusEffect(
    useCallback(() => {
      loadUserMap();
      loadConvInfo();
      loadMessages();
    }, [convId])
  );

  function isGif(text) {
    if (!text) return false;

    try {
      const url = text.trim();
      return (
        url.startsWith("http") &&
        url.toLowerCase().endsWith(".gif")
      );
    } catch {
      return false;
    }
  }

  useEffect(() => {
    const interval = setInterval(() => {
      loadMessages(false);
    }, 4000);

    return () => clearInterval(interval);
  }, [convId]);

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
        myId.current = dec.idPerso;
        globalThis.currentConvKey = dec.key;
      }
    } catch { }
  }

  async function loadMessages(forceScroll = true) {
    const raw = await fetchMessages(convId);
    const { list } = prepareMessages(raw);

    if (JSON.stringify(list) === JSON.stringify(messages)) return;

    setMessages(list);

    if (forceScroll && isUserAtBottomRef.current) {
      setTimeout(scrollToBottom, 10);
    }
  }

  //──────────────── FORMAT
  function formatTime(ts) {
    const d = new Date(Number(ts));
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }

  function formatDayLabel(dateObj) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const day = new Date(dateObj.getTime());
    day.setHours(0, 0, 0, 0);

    const diff = today - day;

    if (diff === 0) return "Aujourd’hui";
    if (diff === 86400000) return "Hier";

    return dateObj.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long"
    });
  }

  //──────────────── GROUP
  function prepareMessages(rawMsgs) {
    if (!rawMsgs || !Array.isArray(rawMsgs)) return { list: [], senders: [] };

    const result = [];
    let lastDay = "";
    let lastMinute = "";
    let lastSender = null;

    for (let msg of rawMsgs) {
      const d = new Date(Number(msg.timestamp));
      if (isNaN(d.getTime())) continue;

      const dayString = formatDayLabel(d);
      const minuteString = d.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit"
      });

      if (dayString !== lastDay) {
        result.push({
          type: "day",
          id: `day-${dayString}`,
          label: dayString
        });
        lastDay = dayString;
        lastMinute = "";
        lastSender = null;
      }

      const startsNewGroup = minuteString !== lastMinute;
      const showPseudo = msg.sender !== lastSender || startsNewGroup;

      result.push({
        ...msg,
        type: "msg",
        showTime: startsNewGroup,
        showPseudo,
        marginTop: startsNewGroup ? 14 : -2
      });

      lastSender = msg.sender;
      lastMinute = minuteString;
    }

    return { list: result };
  }

  //──────────────── RENDER ITEM (STRUCTURE ORIGINALE)
  const renderItem = ({ item }) => {

    if (item.type === "day") {
      return (
        <View style={styles.daySeparatorContainer}>
          <Text style={styles.daySeparatorText}>{item.label}</Text>
        </View>
      );
    }

    const isMe = item.sender === myId.current;
    const pseudo = getPseudo(item.sender);
    const time = formatTime(item.timestamp);

    return (
      <View
        style={[
          styles.row,
          isMe ? styles.rowMe : styles.rowOther,
          { marginTop: item.marginTop ?? 0 }
        ]}
      >

        {isMe && item.showTime && (
          <Text style={[styles.timeSide, styles.timeRight]}>
            {time}
          </Text>
        )}

        <View style={styles.column}>

          {!isMe && item.showPseudo && (
            <Text style={styles.pseudo}>{pseudo}</Text>
          )}

          <TouchableOpacity
            activeOpacity={0.7}
            onLongPress={() => {
              setSelectedMessage(item);
              setMenuVisible(true);
            }}
          >
            <View
              style={[
                styles.bubble,
                isMe ? styles.myBubble : styles.otherBubble,
                item.issave && styles.savedBorder
              ]}
            >
              {isGif(item.text) ? (
                <Image
                  source={{ uri: item.text }}
                  style={styles.gif}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.msgText}>{item.text}</Text>
              )}

            </View>
          </TouchableOpacity>

        </View>

        {!isMe && item.showTime && (
          <Text style={[styles.timeSide, styles.timeLeft]}>
            {time}
          </Text>
        )}

      </View>
    );
  };

  if (!userMapReady) return null;

  return (
    <View style={styles.screen}>

      {/* HEADER */}
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


      {/* CONTENT */}
      <View style={styles.content}>
        <FlatList
          ref={listRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item, index) =>
            item.type === "day" ? `day-${index}` : `msg-${item.id}`
          }
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

      {/* MENU LONG PRESS */}
      {menuVisible && (
        <View style={styles.overlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => setMenuVisible(false)}
          />
          <View style={styles.menu}>

            {/* ENREGISTRER */}
            {!selectedMessage?.issave && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={async () => {
                  const ok = await saveMessage(selectedMessage.id);
                  if (ok) {
                    setMessages(prev =>
                      prev.map(m =>
                        m.id === selectedMessage.id
                          ? { ...m, issave: true }
                          : m
                      )
                    );
                  }
                  setMenuVisible(false);
                }}
              >
                <Text style={styles.menuText}>Enregistrer</Text>
              </TouchableOpacity>
            )}

            {/* DÉSENREGISTRER */}
            {selectedMessage?.issave && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={async () => {
                  const ok = await unsaveMessage(selectedMessage.id);
                  if (ok) {
                    setMessages(prev =>
                      prev.map(m =>
                        m.id === selectedMessage.id
                          ? { ...m, issave: false }
                          : m
                      )
                    );
                  }
                  setMenuVisible(false);
                }}
              >
                <Text style={[styles.menuText, { color: "#f87171" }]}>
                  Désenregistrer
                </Text>
              </TouchableOpacity>
            )}

            {/* SUPPRIMER (SEULEMENT SI C'EST MOI) */}
            {String(selectedMessage?.sender) === String(myId.current)
              && (
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={async () => {
                    const ok = await deleteMessage(selectedMessage.id);
                    if (ok) {
                      setMessages(prev =>
                        prev.filter(m => m.id !== selectedMessage.id)
                      );
                    }
                    setMenuVisible(false);
                  }}
                >
                  <Text style={[styles.menuText, { color: "#ef4444", fontWeight: "bold" }]}>
                    Supprimer
                  </Text>
                </TouchableOpacity>
              )}

          </View>


        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({

  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

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

  content: {
    flex: 1,
    paddingTop: 110,
  },

  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 8,
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

  pseudo: {
    color: colors.subtitle,
    fontSize: 13,
    marginBottom: 2,
    marginLeft: 4,
  },

  bubble: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
  },

  myBubble: {
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    borderRadius: 14,
    borderTopRightRadius: 4,
  },

  otherBubble: {
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 14,
    borderTopLeftRadius: 4,
  },

  savedBorder: {
    borderWidth: 2,
    borderColor: "#8b5cf6",
  },

  msgText: {
    color: colors.text,
    fontSize: 16,
  },

  timeSide: {
    fontSize: 12,
    color: colors.subtitle,
    marginHorizontal: 8,
    marginBottom: 2,
  },

  timeLeft: { alignSelf: "flex-end" },
  timeRight: { alignSelf: "flex-end" },

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

  daySeparatorContainer: {
    width: "100%",
    alignItems: "center",
    marginVertical: 12,
  },

  daySeparatorText: {
    color: colors.subtitle,
    fontSize: 14,
    backgroundColor: colors.backgroundLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },

  menu: {
    position: "absolute",
    bottom: 140,
    left: 30,
    right: 30,
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
  },

  menuItem: {
    padding: 16,
  },

  menuText: {
    color: colors.text,
    textAlign: "center",
    fontSize: 16,
  },

  gif: {
    width: 220,
    height: 220,
    borderRadius: 12,
    backgroundColor: "#000",
  },

});

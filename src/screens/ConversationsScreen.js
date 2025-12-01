import React, { useState, useCallback } from "react";
import { View, Text, TouchableOpacity, FlatList } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import colors from "../theme/colors";

import { loadConversations } from "../utils/ConversationManager";

export default function ConversationsScreen() {

  const navigation = useNavigation();
  const [convs, setConvs] = useState([]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  async function load() {
    const convList = await loadConversations(globalThis.pinHash);
    setConvs(convList);
  }

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={{
        padding: 15,
        borderBottomColor: "#222",
        borderBottomWidth: 1
      }}
      onPress={() => navigation.navigate("ConversationView", { convId: item.id })}
      onLongPress={() => navigation.navigate("EditConv", { convId: item.id })}
    >
      <Text style={{ color: "white", fontSize: 18 }}>{item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex:1, backgroundColor: colors.background }}>
      {convs.length === 0 ? (
        <View style={{ flex:1, justifyContent:"center", alignItems:"center" }}>
          <Text style={{ color:"#666" }}>Aucune conversation…</Text>
        </View>
      ) : (
        <FlatList
          data={convs}
          renderItem={renderItem}
          keyExtractor={i => i.id}
        />
      )}

      {/* bouton + */}
      <TouchableOpacity
        style={{
          position:"absolute",
          bottom:30,
          right:25,
          backgroundColor:"red",
          width:70,
          height:70,
          borderRadius:50,
          justifyContent:"center",
          alignItems:"center"
        }}
        onPress={() => navigation.navigate("MenuConv")}
      >
        <Text style={{ color:"white", fontSize:36 }}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

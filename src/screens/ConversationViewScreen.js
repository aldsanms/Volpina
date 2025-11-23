import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import colors from '../theme/colors';

export default function ConversationViewScreen() {

  const route = useRoute();
  const navigation = useNavigation();

  // Récupère convId envoyé depuis NewConversationScreen
  const { convId } = route.params;

  // Pour l’instant aucun message
  const messages = []; // On mettra la lecture JSON plus tard

  return (
    <View style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹ Retour</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Conversation</Text>

        <TouchableOpacity
          style={styles.shareButton}
          onPress={() => navigation.navigate("ShareConv", { convId })}
        >
          <Text style={styles.shareText}>Partager</Text>
        </TouchableOpacity>
      </View>

      {/* ZONE DES MESSAGES */}
      {messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Aucun message pour le moment…</Text>
        </View>
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <Text style={{ color: "white" }}>{item.text}</Text>
          )}
        />
      )}

      {/* INPUT MESSAGE BIENTÔT */}
      <View style={styles.inputBar}>
        <Text style={{ color: "#555" }}>Barre d’écriture (...)</Text>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container:{
    flex:1,
    backgroundColor:colors.background,
  },

  /* --- HEADER --- */
  header:{
    flexDirection:"row",
    justifyContent:"space-between",
    alignItems:"center",
    paddingTop:50,
    paddingBottom:15,
    paddingHorizontal:20,
    borderBottomWidth:1,
    borderBottomColor:"#222"
  },

  back:{
    color:colors.subtitle,
    fontSize:16
  },

  title:{
    color:"white",
    fontSize:20,
    fontWeight:"bold"
  },

  shareButton:{
    backgroundColor:colors.primary,
    paddingVertical:8,
    paddingHorizontal:12,
    borderRadius:8,
  },

  shareText:{
    color:"white",
    fontSize:14,
    fontWeight:"bold"
  },

  /* --- AUCUN MESSAGE --- */
  emptyContainer:{
    flex:1,
    justifyContent:"center",
    alignItems:"center"
  },

  emptyText:{
    color:"#666",
    fontSize:16
  },

  /* --- BARRE D'ÉCRITURE --- */
  inputBar:{
    borderTopWidth:1,
    borderTopColor:"#222",
    padding:15,
    alignItems:"center"
  }
});

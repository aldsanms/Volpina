import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import colors from "../theme/colors";

export default function MenuConv({ navigation }) {

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nouvelle conversation</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("EditConv")}
      >
        <Text style={styles.buttonText}>Créer une conversation</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("ScanConversation")}
      >
        <Text style={styles.buttonText}>Rejoindre une conversation</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor:"#333" }]}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.buttonText}>Annuler</Text>
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
    padding:30
  },
  title:{
    color:"white",
    fontSize:26,
    marginBottom:40
  },
  button:{
    backgroundColor:colors.primary,
    paddingVertical:14,
    paddingHorizontal:40,
    borderRadius:12,
    marginBottom:20
  },
  buttonText:{
    color:"white",
    fontSize:18,
    fontWeight:"bold"
  }
});

import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image } from 'react-native';
import colors from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';

export default function MenuConv({ navigation }) {

  const phrases = [
    "Que veux-tu faire ?",
    "On fait quoi maintenant ?",
    "Besoin de commencer quelque chose ?",
    "Tu veux créer ou rejoindre une discussion ?",
    "Allons-y, choisis une action !",
    "Une nouvelle conversation peut-être ?",
    "Volpina est prête, et toi ?",
    "Par quoi commence-t-on ?",
  ];

  const [phrase, setPhrase] = useState("");

  useEffect(() => {
    const random = Math.floor(Math.random() * phrases.length);
    setPhrase(phrases[random]);
  }, []);

  const options = [
    { id: '1', title: "Créer une conversation", screen: "NewConversation" },
    { id: '2', title: "Rejoindre une conversation", screen: "ScanConversation" },
  ];

  return (
    <View style={styles.container}>

      {/* Bouton retour */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={28} color={colors.text} />
        <Text style={styles.backText}>Retour</Text>
      </TouchableOpacity>

      {/* Renard Volpina */}
      <Image 
        source={require('../theme/volpina_logo.png')}
        style={styles.logo}
      />

      {/* Titre */}
      <Text style={styles.title}>Volpina</Text>

      {/* Phrase aléatoire */}
      <Text style={styles.subtitle}>{phrase}</Text>

      {/* Liste */}
      <FlatList
        data={options}
        keyExtractor={(item) => item.id}
        style={{ width: "100%" }}
        contentContainerStyle={{ padding: 20 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.listItem}
            onPress={() => navigation.navigate(item.screen)}
          >
            <Text style={styles.listText}>{item.title}</Text>
            <Ionicons name="chevron-forward" size={22} color="white" />
          </TouchableOpacity>
        )}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 40,
    alignItems: 'center',
  },

  /* Bouton Retour */
  backButton: {
    width: "100%",
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  backText: {
    color: colors.text,
    fontSize: 18,
    marginLeft: 5,
  },

  /* Logo */
  logo: {
    width: 90,
    height: 90,
    opacity: 0.9,
    marginBottom: 10,
  },

  /* Titre */
  title: {
    fontSize: 32,
    color: colors.text,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },

  /* Phrase aléatoire */
  subtitle: {
    color: colors.subtitle,
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },

  /* Liste */
  listItem: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  listText: {
    color: 'white',
    fontSize: 18,
    fontWeight: "600",
  },
});

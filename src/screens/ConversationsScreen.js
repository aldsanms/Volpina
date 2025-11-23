import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import colors from '../theme/colors';

const fakeConversations = [
  { id: '1', name: 'Lucas', lastMessage: 'Yo ça avance ?', time: '12:30' },
  { id: '2', name: 'Roger', lastMessage: 'Oh, t y é les sang du coude', time: 'Hier' },
  { id: '3', name: 'Roberto', lastMessage: 'Tuiii Bip Biip Bouuww', time: 'Mar' },
];

export default function ConversationsScreen() {
  const navigation = useNavigation();

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.convCard}>
      <View style={styles.convLeft}>
        <View style={styles.avatar} />
        <View>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.msg}>{item.lastMessage}</Text>
        </View>
      </View>

      <Text style={styles.time}>{item.time}</Text>
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
        data={fakeConversations}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 20 }}
      />

      {/* ─────── BOUTON EN BAS ─────── */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("MenuConv")}
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

  /* ───────────── TOP BAR ───────────── */
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

  /* ───────────── LISTE ───────────── */
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

  /* ───────────── BOUTONS EN BAS ───────────── */
fab: {
  position: 'absolute',
  bottom: 25,
  right: 25,
  width: 60,
  height: 60,
  borderRadius: 12, // carré arrondi
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
}

});

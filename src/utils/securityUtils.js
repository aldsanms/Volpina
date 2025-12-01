import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

const FREEZE_FILE = FileSystem.documentDirectory + "volpina_frozen.json";

// Récupération des données de blocage
export async function getLockData() {
    let fails = 0;
    let lockUntil = 0;

    const fStr = await AsyncStorage.getItem("volpina_master_fails");
    const lStr = await AsyncStorage.getItem("volpina_master_lock_until");

    if (fStr) fails = parseInt(fStr);
    if (lStr) lockUntil = parseInt(lStr);

    // Vérifie aussi le fichier "frozen"
    try {
        const f = await FileSystem.readAsStringAsync(FREEZE_FILE);
        const json = JSON.parse(f);
        if (json.lockUntil > lockUntil) lockUntil = json.lockUntil;
    } catch { }

    return { fails, lockUntil };
}

// Mise à jour du compteur d’échecs
export async function updateFailCount() {
    const { fails } = await getLockData();
    const newFails = fails + 1;

    // 3 erreurs → bloc 1 min
    if (newFails === 3) {
        await setFrozenBlock(newFails, 1);
        alert("Trop d'essais incorrects ! Bloqué 1 minute.");
        return;
    }

    // 6 erreurs → bloc 5 min
    if (newFails === 6) {
        await setFrozenBlock(newFails, 5);
        alert("Encore des erreurs ! Bloqué 5 minutes.");
        return;
    }

    // 9 erreurs → bloc 30 min + wipe sécurité
    if (newFails === 9) {
        await setFrozenBlock(newFails, 30);
        alert("Trop d'erreurs ! Blocage 30 minutes.");
        return;
    }

    await AsyncStorage.setItem("volpina_master_fails", newFails.toString());
}

// Active un blocage de X minutes
async function setFrozenBlock(fails, minutes) {
    const until = Date.now() + minutes * 60000;

    await AsyncStorage.setItem("volpina_master_fails", fails.toString());
    await AsyncStorage.setItem("volpina_master_lock_until", until.toString());

    // fichier “frozen” en plus → ultra sécurisé
    await FileSystem.writeAsStringAsync(
        FREEZE_FILE,
        JSON.stringify({ lockUntil: until }),
        { encoding: FileSystem.EncodingType.UTF8 }
    );
}

// Clear des données si login réussi
export async function clearFailData() {
    await AsyncStorage.removeItem("volpina_master_fails");
    await AsyncStorage.removeItem("volpina_master_lock_until");

    // Supprime le fichier "frozen"
    try {
        await FileSystem.deleteAsync(FREEZE_FILE, { idempotent: true });
    } catch { }
}

// ---- LISTES DE PSEUDOS VOLPINA ----

export const pseudoAdjectives = [
  "Furtif", "Sombre", "Vif", "Brillant", "Murmurant",
  "Ardent", "Nébuleux", "Cendré", "Écarlate", "Obscur",
  "Lumineux", "Silencieux", "Farouche", "Éthéré"
];

export const pseudoAnimals = [
  "Renard", "Lynx", "Loup", "Corbeau", "Faucon",
  "Panthère", "Ombre", "Blizzard", "Spectre", "Dragon",
  "Coyote", "Épervier", "Puma", "Chacal"
];


// ---- GÉNÉRATION D'UN PSEUDO UNIQUE ----

export function generatePseudo(existingList = []) {
  let pseudo;

  do {
    const adj = pseudoAdjectives[Math.floor(Math.random() * pseudoAdjectives.length)];
    const animal = pseudoAnimals[Math.floor(Math.random() * pseudoAnimals.length)];

    pseudo = `${adj} ${animal}`;

    // Si déjà pris -> ajoute un numéro
    if (existingList.includes(pseudo)) {
      pseudo = `${pseudo} #${Math.floor(Math.random() * 999)}`;
    }

  } while (existingList.includes(pseudo));

  return pseudo;
}

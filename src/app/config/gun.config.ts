"use server";

import Gun from "gun";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Helper pour obtenir le nom du répertoire
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// S'assure que le dossier existe
const databaseDir = path.resolve(__dirname, "../database/connection");
if (!fs.existsSync(databaseDir)) {
  fs.mkdirSync(databaseDir, { recursive: true });
}

// Chemin complet vers le fichier de données
const dataFile = path.join(databaseDir, "data.json");

// Fonction pour initialiser GunDB
export async function initGun() {
  return Gun({
    file: dataFile,
    localStorage: false, // Désactive l'utilisation de localStorage (pour Node.js)
  });
}

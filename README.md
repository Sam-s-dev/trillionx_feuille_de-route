# TRILLIONX — Feuille de route (Backend & SQL)

Cette application est le système opérationnel de suivi de la feuille de route de **TRILLIONX** (Août – Décembre 2026 et au-delà).
Elle a été migrée d'une application purement frontend vers une architecture client-serveur avec persistance dans une base de données relationnelle **SQLite**.

## Fonctionnalités

- **Persistance SQL** : Les modifications de tâches, de caisse et l'état des sections sont stockées dans une base de données SQLite locale.
- **Synchronisation en direct** : Toute modification est automatiquement envoyée au serveur et synchronisée.
- **Fallback Local** : En cas de déconnexion réseau, l'application utilise automatiquement le stockage local du navigateur (localStorage) de secours.
- **Seeding Automatique** : Au premier démarrage, si la base est vide, elle s'initialise automatiquement avec la structure et les tâches par défaut de TRILLIONX.
- **Noms des associés à jour** :
  - **Louceny Dabo** (associé confirmé)
  - **Djenabou Barry** (partenaire externe pour Boutique Flow)

## Installation et Démarrage Local

### Prérequis
- [Node.js](https://nodejs.org/) (Version 18 ou supérieure recommandée)
- npm (installé automatiquement avec Node.js)

### 1. Installer les dépendances
Dans le dossier du projet, exécutez la commande suivante :
```bash
npm install
```

### 2. Démarrer le serveur
Lancez le serveur avec :
```bash
npm start
```
Le serveur démarrera par défaut sur le port **2027** :
Accès dans le navigateur : [http://localhost:2027](http://localhost:2027)


La base de données SQLite sera automatiquement créée sous le nom de `database.sqlite` à la racine du projet.

---

## Déploiement en Production

Pour déployer cette application sur le cloud (Render, Railway, Fly.io, Heroku, VPS, etc.) :

1. **Variables d'environnement** :
   - `PORT` : Le serveur Express utilise la variable d'environnement `PORT` pour écouter. La plupart des plateformes cloud (comme Render ou Railway) la définissent automatiquement.
   - `DATABASE_PATH` (Optionnel) : Chemin absolu vers le fichier de la base de données. Très utile pour configurer un volume persistant sur des hébergeurs à système de fichiers éphémère (ex: `/var/data/database.sqlite`).

2. **Hébergement avec persistance (Recommandé)** :
   - Sur **Render** ou **Railway**, ajoutez un **Persistent Volume** (par exemple monté sur `/data`) et définissez la variable d'environnement `DATABASE_PATH=/data/database.sqlite` afin de ne pas perdre vos données à chaque redémarrage ou déploiement du serveur.

## Structure du Projet

```
├── public/
│   └── index.html        # Le frontend (HTML, CSS, JS interactif)
├── database.js           # Configuration SQLite, schéma et fonctions d'accès aux données
├── server.js             # Serveur Express et API REST
├── package.json          # Dépendances Node.js
└── README.md             # Ce fichier
```

## Structure de la Base de Données (SQL)

La base de données SQLite contient les tables suivantes :

```sql
-- Montant de la caisse d'entreprise
CREATE TABLE caisse (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  valeur INTEGER DEFAULT 0
);

-- États d'ouverture/fermeture des phases
CREATE TABLE collapsed (
  phase_id TEXT PRIMARY KEY,
  is_collapsed INTEGER DEFAULT 0
);

-- Liste des tâches
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  phase_id TEXT,
  group_label TEXT,
  text TEXT,
  difficulty TEXT,
  done INTEGER DEFAULT 0,
  position INTEGER
);
```
Vous pouvez interroger ce fichier `database.sqlite` à tout moment pour exporter des données ou analyser la progression de l'équipe avec des requêtes SQL classiques.

const express = require('express');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 2027;


app.use(express.json({ limit: '10mb' })); // Support larger state if needed
app.use(express.static(path.join(__dirname, 'public')));

// Route pour récupérer l'état complet
app.get('/api/state', async (req, res) => {
  try {
    const state = await db.getState();
    res.json(state);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération de la feuille de route', details: err.message });
  }
});

// Route pour récupérer les statistiques d'agrégation SQL
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await db.getStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors du calcul des statistiques', details: err.message });
  }
});


// Route pour enregistrer l'état complet
app.post('/api/state', async (req, res) => {
  try {
    const result = await db.saveState(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la sauvegarde de la feuille de route', details: err.message });
  }
});

// Route pour réinitialiser la feuille de route
app.post('/api/reset', async (req, res) => {
  try {
    const newState = await db.resetToDefault();
    res.json(newState);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la réinitialisation de la feuille de route', details: err.message });
  }
});

// Toutes les autres routes redirigent vers l'application frontend index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialise d'abord la base de données puis démarre le serveur
async function start() {
  try {
    await db.initDatabase();
    app.listen(PORT, () => {
      console.log(`==================================================`);
      console.log(`Feuille de route TRILLIONX démarrée sur le port ${PORT}`);
      console.log(`Accès local : http://localhost:${PORT}`);
      console.log(`==================================================`);
    });
  } catch (err) {
    console.error("Impossible de démarrer le serveur :", err);
    process.exit(1);
  }
}

start();

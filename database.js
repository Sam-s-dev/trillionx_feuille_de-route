const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erreur lors de la connexion à SQLite:', err.message);
  } else {
    console.log('Connecté à la base de données SQLite:', dbPath);
  }
});

// Helper pour exécuter des requêtes SQL (Promise)
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        console.error('SQL Error Run:', sql, err);
        reject(err);
      } else {
        resolve(this);
      }
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('SQL Error All:', sql, err);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        console.error('SQL Error Get:', sql, err);
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

// Initialise la structure de la base de données
async function initDatabase() {
  await run(`
    CREATE TABLE IF NOT EXISTS caisse (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      valeur INTEGER DEFAULT 0
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS collapsed (
      phase_id TEXT PRIMARY KEY,
      is_collapsed INTEGER DEFAULT 0
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      phase_id TEXT,
      group_label TEXT,
      text TEXT,
      difficulty TEXT,
      done INTEGER DEFAULT 0,
      position INTEGER
    )
  `);

  // Vérifier si nous devons insérer les données par défaut (si la table tasks est vide)
  const taskCountRow = await get('SELECT COUNT(*) AS count FROM tasks');
  if (taskCountRow && taskCountRow.count === 0) {
    console.log('Base de données vide. Initialisation avec les données par défaut...');
    await seedDefaultData();
  }
}

// Données par défaut avec les corrections demandées :
// - Louceny Dabo confirmé (sans mention "à confirmer")
// - Partenaire externe renommée en Djenabou Barry
async function seedDefaultData() {
  // Caisse par défaut
  await run('INSERT INTO caisse (id, valeur) VALUES (1, 0) ON CONFLICT(id) DO NOTHING');

  // Tâches par défaut
  const defaultTasks = [];
  let pos = 1;

  const T = (phaseId, groupLabel, text, difficulty) => {
    defaultTasks.push({
      id: 't' + Math.random().toString(36).slice(2, 10),
      phase_id: phaseId,
      group_label: groupLabel,
      text: text,
      difficulty: difficulty,
      done: 0,
      position: pos++
    });
  };

  // Phase 1
  T('p1', 'Smart School', "Finaliser complètement l'application Smart School", 'elevee');
  T('p1', 'Smart School', "Effectuer les tests et corrections", 'moyenne');
  T('p1', 'Smart School', "Déployer la version prête pour la mission (objectif : prête avant Fria)", 'moyenne');
  T('p1', 'Smart School', "Appeler les fondateurs des écoles privées de Fria pour valider le marché", 'facile');

  T('p1', 'ORDIVEX', "Confirmer l'installation à la pharmacie de Koya (inventaire déjà fait)", 'facile');
  T('p1', 'ORDIVEX', "Finaliser la discussion avec la 2e pharmacie (responsable + mari)", 'moyenne');
  T('p1', 'ORDIVEX', "Installer ORDIVEX dans au moins 2 pharmacies avant le départ à Fria", 'elevee');
  T('p1', 'ORDIVEX', "Continuer la prospection de nouvelles pharmacies", 'moyenne');

  T('p1', 'Boutique Flow', "Prospection intensive par l'équipe (Mohamed Sams Deen Camara, Alseny Camara, Mohamed Iya Camara) + Djenabou Barry", 'moyenne');
  T('p1', 'Boutique Flow', "Former les commerçants à la nouvelle méthode : ils saisissent eux-mêmes leurs produits, avec accompagnement", 'moyenne');
  T('p1', 'Boutique Flow', "Transférer la responsabilité de prospection et d'acquisition à Djenabou Barry", 'facile');

  // Phase 2
  T('p2', 'Sur place à Fria', "Départ pour Fria le 15 août — équipe : Mohamed Sams Deen Camara, Alseny Camara, Mohamed Iya Camara", 'elevee');
  T('p2', 'Sur place à Fria', "Gérer le budget de mission : 1 000 000 GNF pris dans la caisse de l'entreprise", 'facile');
  T('p2', 'Sur place à Fria', "Rencontrer les écoles privées de Fria", 'elevee');
  T('p2', 'Sur place à Fria', "Installer Smart School dans les premiers établissements", 'elevee');
  T('p2', 'Sur place à Fria', "Signer les premiers établissements", 'elevee');

  T('p2', "Pendant l'absence, à Conakry", "Ne pas laisser le marché de Conakry vide — assurer un suivi à distance", 'moyenne');
  T('p2', "Pendant l'absence, à Conakry", "Trouver une solution pour obtenir la cartographie des écoles privées de Conakry", 'moyenne');
  T('p2', "Pendant l'absence, à Conakry", "Poursuivre les contacts avec les pharmacies", 'facile');
  T('p2', "Pendant l'absence, à Conakry", "Préparer les rendez-vous pour l'installation de nouvelles pharmacies au retour", 'facile');

  T('p2', 'Objectifs au retour', "Avoir au minimum 4 nouvelles pharmacies en discussion, en plus des deux premières", 'elevee');
  T('p2', 'Objectifs au retour', "Revenir de Fria avec des rendez-vous déjà planifiés", 'moyenne');
  T('p2', 'Objectifs au retour', "Boutique Flow — Djenabou Barry recherche de nouveaux clients, mène les discussions commerciales et prépare les contrats", 'moyenne');

  // Objectifs mensuels récurrents (Sep, Oct, Nov, Dec)
  const addMonthlyTasks = (phaseId) => {
    T(phaseId, 'Objectifs minimums du mois', "Signer au minimum 5 nouvelles pharmacies (ORDIVEX) — ≈ 6 000 000 GNF/pharmacie, prix adaptable", 'elevee');
    T(phaseId, 'Objectifs minimums du mois', "Signer au minimum 3 nouvelles boutiques (Boutique Flow) — ≈ 300 000 GNF/mois, prix adaptable", 'moyenne');
    T(phaseId, 'Objectifs minimums du mois', "Signer 3 à 5 écoles privées (Smart School) — ≈ 5 000 000 GNF/an, prix adaptable", 'elevee');
    T(phaseId, 'Objectifs minimums du mois', "Mettre à jour le suivi de caisse du mois", 'facile');
  };

  addMonthlyTasks('sep');
  addMonthlyTasks('oct');
  addMonthlyTasks('nov');
  addMonthlyTasks('dec');

  // Mamou
  T('mamou', 'Préparation du voyage', "Planifier la date précise du voyage à Mamou", 'facile');
  T('mamou', 'Préparation du voyage', "Définir le budget du voyage (à préciser une fois la date proche)", 'facile');

  T('mamou', 'Sur le terrain', "Rencontrer les agriculteurs d'oignon à Mamou et comprendre leurs besoins", 'moyenne');
  T('mamou', 'Sur le terrain', "Mettre en place la relation agriculteurs ↔ acheteurs de Conakry (hôtels, restaurants, grossistes, tout type d'acheteur)", 'elevee');

  T('mamou', 'Après le voyage', "Rédiger un rapport détaillé du voyage avec tous les éléments (besoins des agriculteurs, mise en place, dépenses)", 'facile');

  // Exécution de l'insertion en série
  db.serialize(() => {
    const stmt = db.prepare('INSERT INTO tasks (id, phase_id, group_label, text, difficulty, done, position) VALUES (?, ?, ?, ?, ?, ?, ?)');
    for (const t of defaultTasks) {
      stmt.run(t.id, t.phase_id, t.group_label, t.text, t.difficulty, t.done, t.position);
    }
    stmt.finalize();
    console.log('Seeding des tâches par défaut terminé.');
  });
}

// Récupère l'état complet
async function getState() {
  const caisseRow = await get('SELECT valeur FROM caisse WHERE id = 1');
  const caisseActuelle = caisseRow ? caisseRow.valeur : 0;

  const collapsedRows = await all('SELECT phase_id, is_collapsed FROM collapsed');
  const collapsed = {};
  for (const row of collapsedRows) {
    collapsed[row.phase_id] = !!row.is_collapsed;
  }

  const tasksRows = await all('SELECT * FROM tasks ORDER BY position ASC');

  // Définition statique des phases (pour structurer la réponse)
  const phasesTemplates = [
    { id: 'p1', title: 'Phase 1 — Préparation avant Fria', range: '1 – 15 août 2026', groups: [] },
    { id: 'p2', title: 'Phase 2 — Mission Fria', range: '15 – 31 août 2026', groups: [] },
    { id: 'sep', title: 'Septembre 2026', range: 'Objectifs mensuels récurrents (après retour de Fria)', groups: [] },
    { id: 'oct', title: 'Octobre 2026', range: 'Objectifs mensuels récurrents (après retour de Fria)', groups: [] },
    { id: 'nov', title: 'Novembre 2026', range: 'Objectifs mensuels récurrents (après retour de Fria)', groups: [] },
    { id: 'dec', title: 'Décembre 2026', range: 'Objectifs mensuels récurrents (après retour de Fria)', groups: [] },
    { id: 'mamou', title: 'Agriculteur Connecté — Voyage à Mamou', range: 'Date à définir (entre septembre et décembre 2026)', groups: [] }
  ];

  // Regrouper les tâches par phase et groupe
  for (const p of phasesTemplates) {
    const phaseTasks = tasksRows.filter(t => t.phase_id === p.id);
    
    // Identifier les groupes uniques dans l'ordre d'apparition
    const groupLabels = [];
    for (const t of phaseTasks) {
      if (!groupLabels.includes(t.group_label)) {
        groupLabels.push(t.group_label);
      }
    }

    for (const label of groupLabels) {
      const tasks = phaseTasks
        .filter(t => t.group_label === label)
        .map(t => ({
          id: t.id,
          text: t.text,
          difficulty: t.difficulty,
          done: !!t.done
        }));

      p.groups.push({
        label: label,
        tasks: tasks
      });
    }
  }

  return {
    caisseActuelle,
    collapsed,
    phases: phasesTemplates
  };
}

// Sauvegarde l'état complet
function saveState(state) {
  return new Promise((resolve, reject) => {
    db.serialize(async () => {
      try {
        await run('BEGIN TRANSACTION');

        // 1. Caisse
        await run('INSERT INTO caisse (id, valeur) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET valeur = excluded.valeur', [state.caisseActuelle || 0]);

        // 2. Collapsed
        await run('DELETE FROM collapsed');
        if (state.collapsed) {
          const stmtCollapsed = db.prepare('INSERT INTO collapsed (phase_id, is_collapsed) VALUES (?, ?)');
          for (const [phaseId, isCol] of Object.entries(state.collapsed)) {
            stmtCollapsed.run(phaseId, isCol ? 1 : 0);
          }
          stmtCollapsed.finalize();
        }

        // 3. Tasks
        await run('DELETE FROM tasks');
        if (state.phases) {
          const stmtTask = db.prepare('INSERT INTO tasks (id, phase_id, group_label, text, difficulty, done, position) VALUES (?, ?, ?, ?, ?, ?, ?)');
          let pos = 1;
          for (const phase of state.phases) {
            if (!phase.groups) continue;
            for (const group of phase.groups) {
              if (!group.tasks) continue;
              for (const task of group.tasks) {
                stmtTask.run(
                  task.id,
                  phase.id,
                  group.label,
                  task.text,
                  task.difficulty,
                  task.done ? 1 : 0,
                  pos++
                );
              }
            }
          }
          stmtTask.finalize();
        }

        await run('COMMIT');
        resolve({ success: true });
      } catch (err) {
        db.run('ROLLBACK');
        console.error('Erreur lors de la transaction de sauvegarde state:', err);
        reject(err);
      }
    });
  });
}

// Fonction de réinitialisation complète aux valeurs par défaut
async function resetToDefault() {
  await run('DELETE FROM tasks');
  await run('DELETE FROM collapsed');
  await run('DELETE FROM caisse');
  await seedDefaultData();
  return await getState();
}

async function getStats() {
  const globalRow = await get(`
    SELECT 
      COUNT(*) as total, 
      SUM(CASE WHEN done = 1 THEN 1 ELSE 0 END) as completed 
    FROM tasks
  `);
  
  const difficultyRows = await all(`
    SELECT difficulty, COUNT(*) as count 
    FROM tasks 
    GROUP BY difficulty
  `);
  
  const phaseRows = await all(`
    SELECT phase_id, COUNT(*) as total, SUM(CASE WHEN done = 1 THEN 1 ELSE 0 END) as completed 
    FROM tasks 
    GROUP BY phase_id
  `);
  
  const caisseRow = await get('SELECT valeur FROM caisse WHERE id = 1');
  const caisseActuelle = caisseRow ? caisseRow.valeur : 0;
  
  return {
    global: {
      total: globalRow ? globalRow.total : 0,
      completed: globalRow && globalRow.completed ? globalRow.completed : 0
    },
    difficulty: difficultyRows,
    phases: phaseRows,
    caisse: caisseActuelle
  };
}

module.exports = {
  initDatabase,
  getState,
  saveState,
  resetToDefault,
  getStats
};


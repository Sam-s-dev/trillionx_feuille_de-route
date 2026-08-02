const { Pool } = require('pg');

// Connexion PostgreSQL via DATABASE_URL (fourni par Neon.tech ou Render)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

pool.on('connect', () => {
  console.log('Connecté à la base de données PostgreSQL');
});

pool.on('error', (err) => {
  console.error('Erreur PostgreSQL inattendue:', err.message);
});

// ========== Initialisation de la base de données ==========

async function initDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS caisse (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        valeur BIGINT DEFAULT 0
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS collapsed (
        phase_id TEXT PRIMARY KEY,
        is_collapsed INTEGER DEFAULT 0
      )
    `);

    await client.query(`
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

    // Vérifier si nous devons insérer les données par défaut
    const result = await client.query('SELECT COUNT(*) AS count FROM tasks');
    if (parseInt(result.rows[0].count) === 0) {
      console.log('Base de données vide. Initialisation avec les données par défaut...');
      await seedDefaultData(client);
    }
  } finally {
    client.release();
  }
}

// ========== Données par défaut ==========

async function seedDefaultData(client) {
  // Caisse par défaut
  await client.query(
    'INSERT INTO caisse (id, valeur) VALUES (1, 0) ON CONFLICT (id) DO NOTHING'
  );

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

  // Objectifs mensuels récurrents
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

  // Insertion en batch
  for (const t of defaultTasks) {
    await client.query(
      'INSERT INTO tasks (id, phase_id, group_label, text, difficulty, done, position) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [t.id, t.phase_id, t.group_label, t.text, t.difficulty, t.done, t.position]
    );
  }
  console.log(`Seeding terminé : ${defaultTasks.length} tâches insérées.`);
}

// ========== Lecture de l'état complet ==========

async function getState() {
  const client = await pool.connect();
  try {
    const caisseResult = await client.query('SELECT valeur FROM caisse WHERE id = 1');
    const caisseActuelle = caisseResult.rows.length > 0 ? parseInt(caisseResult.rows[0].valeur) : 0;

    const collapsedResult = await client.query('SELECT phase_id, is_collapsed FROM collapsed');
    const collapsed = {};
    for (const row of collapsedResult.rows) {
      collapsed[row.phase_id] = !!row.is_collapsed;
    }

    const tasksResult = await client.query('SELECT * FROM tasks ORDER BY position ASC');

    const phasesTemplates = [
      { id: 'p1', title: 'Phase 1 — Préparation avant Fria', range: '1 – 15 août 2026', groups: [] },
      { id: 'p2', title: 'Phase 2 — Mission Fria', range: '15 – 31 août 2026', groups: [] },
      { id: 'sep', title: 'Septembre 2026', range: 'Objectifs mensuels récurrents (après retour de Fria)', groups: [] },
      { id: 'oct', title: 'Octobre 2026', range: 'Objectifs mensuels récurrents (après retour de Fria)', groups: [] },
      { id: 'nov', title: 'Novembre 2026', range: 'Objectifs mensuels récurrents (après retour de Fria)', groups: [] },
      { id: 'dec', title: 'Décembre 2026', range: 'Objectifs mensuels récurrents (après retour de Fria)', groups: [] },
      { id: 'mamou', title: 'Agriculteur Connecté — Voyage à Mamou', range: 'Date à définir (entre septembre et décembre 2026)', groups: [] }
    ];

    for (const p of phasesTemplates) {
      const phaseTasks = tasksResult.rows.filter(t => t.phase_id === p.id);
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
        p.groups.push({ label, tasks });
      }
    }

    return { caisseActuelle, collapsed, phases: phasesTemplates };
  } finally {
    client.release();
  }
}

// ========== Sauvegarde de l'état complet ==========

async function saveState(state) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Caisse
    await client.query(
      'INSERT INTO caisse (id, valeur) VALUES (1, $1) ON CONFLICT (id) DO UPDATE SET valeur = EXCLUDED.valeur',
      [state.caisseActuelle || 0]
    );

    // 2. Collapsed
    await client.query('DELETE FROM collapsed');
    if (state.collapsed) {
      for (const [phaseId, isCol] of Object.entries(state.collapsed)) {
        await client.query(
          'INSERT INTO collapsed (phase_id, is_collapsed) VALUES ($1, $2)',
          [phaseId, isCol ? 1 : 0]
        );
      }
    }

    // 3. Tasks
    await client.query('DELETE FROM tasks');
    if (state.phases) {
      let pos = 1;
      for (const phase of state.phases) {
        if (!phase.groups) continue;
        for (const group of phase.groups) {
          if (!group.tasks) continue;
          for (const task of group.tasks) {
            await client.query(
              'INSERT INTO tasks (id, phase_id, group_label, text, difficulty, done, position) VALUES ($1, $2, $3, $4, $5, $6, $7)',
              [task.id, phase.id, group.label, task.text, task.difficulty, task.done ? 1 : 0, pos++]
            );
          }
        }
      }
    }

    await client.query('COMMIT');
    return { success: true };
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erreur de sauvegarde PostgreSQL:', err);
    throw err;
  } finally {
    client.release();
  }
}

// ========== Réinitialisation ==========

async function resetToDefault() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM tasks');
    await client.query('DELETE FROM collapsed');
    await client.query('DELETE FROM caisse');
    await seedDefaultData(client);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
  return await getState();
}

// ========== Statistiques d'agrégation SQL ==========

async function getStats() {
  const client = await pool.connect();
  try {
    const globalResult = await client.query(`
      SELECT COUNT(*) AS total, SUM(CASE WHEN done = 1 THEN 1 ELSE 0 END) AS completed FROM tasks
    `);
    const global = {
      total: parseInt(globalResult.rows[0].total) || 0,
      completed: parseInt(globalResult.rows[0].completed) || 0
    };

    const diffResult = await client.query(`
      SELECT difficulty, COUNT(*) AS count FROM tasks GROUP BY difficulty
    `);
    const difficulty = diffResult.rows.map(r => ({ difficulty: r.difficulty, count: parseInt(r.count) }));

    const phaseResult = await client.query(`
      SELECT phase_id, COUNT(*) AS total, SUM(CASE WHEN done = 1 THEN 1 ELSE 0 END) AS completed
      FROM tasks GROUP BY phase_id
    `);
    const phases = phaseResult.rows.map(r => ({
      phase_id: r.phase_id,
      total: parseInt(r.total),
      completed: parseInt(r.completed) || 0
    }));

    const caisseResult = await client.query('SELECT valeur FROM caisse WHERE id = 1');
    const caisse = caisseResult.rows.length > 0 ? parseInt(caisseResult.rows[0].valeur) : 0;

    return { global, difficulty, phases, caisse };
  } finally {
    client.release();
  }
}

module.exports = {
  initDatabase,
  getState,
  saveState,
  resetToDefault,
  getStats
};

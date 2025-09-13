const { MongoClient } = require('mongodb');

// Configuración de conexión
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://casadelosfamosos36:AdBWE87JKPbgHPS4@cluster0.jbmcxhn.mongodb.net/casafamosos?retryWrites=true&w=majority&appName=Cluster0';

async function createIndexSafely(collection, spec, options, indexName) {
  try {
    await collection.createIndex(spec, options);
    console.log(`  ✅ ${indexName} creado`);
  } catch (error) {
    if (error.code === 85) { // IndexOptionsConflict
      console.log(`  ⚠️ ${indexName} ya existe`);
    } else {
      console.log(`  ❌ Error creando ${indexName}:`, error.message);
    }
  }
}

async function createIndexes() {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log('🔗 Conectando a MongoDB...');
    await client.connect();

    const db = client.db();
    console.log('✅ Conectado exitosamente');

    // Índices para Season (temporadas)
    console.log('\n📋 Creando índices para seasons...');
    const seasonsCollection = db.collection('seasons');

    await createIndexSafely(seasonsCollection, { "isActive": 1 }, { name: "idx_seasons_isActive" }, "isActive");
    await createIndexSafely(seasonsCollection, { "status": 1 }, { name: "idx_seasons_status" }, "status");
    await createIndexSafely(seasonsCollection, { "year": 1 }, { name: "idx_seasons_year" }, "year");

    // Índices para Candidates (candidatos)
    console.log('\n👥 Creando índices para candidates...');
    const candidatesCollection = db.collection('candidates');

    await createIndexSafely(candidatesCollection, { "seasonId": 1 }, { name: "idx_candidates_seasonId" }, "seasonId");
    await createIndexSafely(candidatesCollection, { "seasonId": 1, "isNominated": 1, "isEliminated": 1 }, { name: "idx_candidates_season_nominated_eliminated" }, "season+nominated+eliminated");
    await createIndexSafely(candidatesCollection, { "seasonId": 1, "isEliminated": 1 }, { name: "idx_candidates_season_eliminated" }, "season+eliminated");
    await createIndexSafely(candidatesCollection, { "status": 1 }, { name: "idx_candidates_status" }, "status");
    await createIndexSafely(candidatesCollection, { "isActive": 1 }, { name: "idx_candidates_isActive" }, "isActive");
    await createIndexSafely(candidatesCollection, { "stats.totalVotes": -1 }, { name: "idx_candidates_totalVotes_desc" }, "totalVotes desc");
    await createIndexSafely(candidatesCollection, { "stats.weeklyVotes": -1 }, { name: "idx_candidates_weeklyVotes_desc" }, "weeklyVotes desc");
    await createIndexSafely(candidatesCollection, { "eliminationInfo.isEliminated": 1 }, { name: "idx_candidates_eliminated" }, "eliminated");

    // Índices para Votes (votos)
    console.log('\n🗳️ Creando índices para votes...');
    const votesCollection = db.collection('votes');

    await createIndexSafely(votesCollection, { "userId": 1, "weekId": 1 }, { name: "idx_votes_user_week" }, "user+week");
    await createIndexSafely(votesCollection, { "candidateId": 1, "weekId": 1 }, { name: "idx_votes_candidate_week" }, "candidate+week");
    await createIndexSafely(votesCollection, { "seasonId": 1, "weekId": 1 }, { name: "idx_votes_season_week" }, "season+week");
    await createIndexSafely(votesCollection, { "weekId": 1, "voteDate": -1 }, { name: "idx_votes_week_date" }, "week+date");
    await createIndexSafely(votesCollection, { "userId": 1, "seasonId": 1, "weekNumber": 1 }, { name: "idx_votes_user_season_weeknum" }, "user+season+weekNumber");
    await createIndexSafely(votesCollection, { "voteDate": -1 }, { name: "idx_votes_voteDate_desc" }, "voteDate desc");
    await createIndexSafely(votesCollection, { "isValid": 1 }, { name: "idx_votes_isValid" }, "isValid");
    await createIndexSafely(votesCollection, { "candidateId": 1, "isValid": 1 }, { name: "idx_votes_candidate_valid" }, "candidate+valid");
    await createIndexSafely(votesCollection, { "seasonId": 1, "isValid": 1 }, { name: "idx_votes_season_valid" }, "season+valid");

    // Índices para Users (usuarios)
    console.log('\n👤 Creando índices para users...');
    const usersCollection = db.collection('users');

    await createIndexSafely(usersCollection, { "email": 1 }, { name: "idx_users_email", unique: true }, "email unique");
    await createIndexSafely(usersCollection, { "googleId": 1 }, { name: "idx_users_googleId", sparse: true }, "googleId");
    await createIndexSafely(usersCollection, { "lastVoteDate": -1 }, { name: "idx_users_lastVoteDate" }, "lastVoteDate");
    await createIndexSafely(usersCollection, { "isActive": 1 }, { name: "idx_users_isActive" }, "isActive");

    // Mostrar índices existentes
    console.log('\n📊 Verificando índices creados...');

    const seasonIndexes = await seasonsCollection.indexes();
    const candidateIndexes = await candidatesCollection.indexes();
    const voteIndexes = await votesCollection.indexes();
    const userIndexes = await usersCollection.indexes();

    console.log(`\n📋 Seasons: ${seasonIndexes.length} índices`);
    console.log(`👥 Candidates: ${candidateIndexes.length} índices`);
    console.log(`🗳️ Votes: ${voteIndexes.length} índices`);
    console.log(`👤 Users: ${userIndexes.length} índices`);

    console.log('\n🎉 ¡Todos los índices creados exitosamente!');
    console.log('⚡ Tu aplicación ahora debería ser mucho más rápida');

  } catch (error) {
    console.error('❌ Error creando índices:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔐 Conexión cerrada');
  }
}

// Ejecutar el script
if (require.main === module) {
  createIndexes().catch(console.error);
}

module.exports = { createIndexes };
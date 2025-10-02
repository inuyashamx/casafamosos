const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Leer .env.local manualmente
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && values.length > 0) {
    envVars[key.trim()] = values.join('=').trim();
  }
});

async function checkVotesDistribution() {
  try {
    // Conectar a MongoDB
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(envVars.MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    // 1. Ver distribución de votos por weekId en los últimos 5 días
    console.log('📊 DISTRIBUCIÓN DE VOTOS POR WEEK_ID (últimos 5 días):\n');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 5);

    const votesByWeek = await db.collection('votes').aggregate([
      {
        $match: {
          voteDate: { $gte: startDate },
          isValid: true
        }
      },
      {
        $group: {
          _id: '$weekId',
          count: { $sum: 1 },
          totalPoints: { $sum: '$points' },
          minDate: { $min: '$voteDate' },
          maxDate: { $max: '$voteDate' }
        }
      },
      { $sort: { totalPoints: -1 } }
    ]).toArray();

    console.log(`Total de grupos weekId encontrados: ${votesByWeek.length}\n`);

    for (const item of votesByWeek) {
      console.log(`WeekId: ${item._id || 'NULL'}`);
      console.log(`  - Votos (documentos): ${item.count.toLocaleString()}`);
      console.log(`  - Puntos totales: ${item.totalPoints.toLocaleString()}`);
      console.log(`  - Fecha mín: ${item.minDate.toLocaleString('es-ES')}`);
      console.log(`  - Fecha máx: ${item.maxDate.toLocaleString('es-ES')}`);

      // Buscar información de la semana
      if (item._id) {
        const week = await db.collection('weeks').findOne({ _id: item._id });
        if (week) {
          console.log(`  - Semana: #${week.weekNumber} - ${week.name}`);
          console.log(`  - Estado: ${week.status}`);
          console.log(`  - Votación activa: ${week.isVotingActive ? 'SÍ' : 'NO'}`);
        } else {
          console.log(`  - ⚠️ SEMANA NO ENCONTRADA EN BD`);
        }
      } else {
        console.log(`  - ⚠️ VOTOS SIN WEEK_ID`);
      }
      console.log('');
    }

    // 2. Ver distribución por fecha
    console.log('\n📅 DISTRIBUCIÓN DE VOTOS POR FECHA:\n');
    const votesByDate = await db.collection('votes').aggregate([
      {
        $match: {
          voteDate: { $gte: startDate },
          isValid: true
        }
      },
      {
        $project: {
          date: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$voteDate'
            }
          },
          points: 1,
          weekId: 1
        }
      },
      {
        $group: {
          _id: '$date',
          count: { $sum: 1 },
          totalPoints: { $sum: '$points' },
          uniqueWeeks: { $addToSet: '$weekId' }
        }
      },
      { $sort: { _id: -1 } }
    ]).toArray();

    for (const item of votesByDate) {
      console.log(`Fecha: ${item._id}`);
      console.log(`  - Votos (documentos): ${item.count.toLocaleString()}`);
      console.log(`  - Puntos totales: ${item.totalPoints.toLocaleString()}`);
      console.log(`  - WeekIds únicos: ${item.uniqueWeeks.length}`);
      console.log('');
    }

    // 3. Ver semanas activas actuales
    console.log('\n🗳️ SEMANAS ACTIVAS/RECIENTES:\n');
    const weeks = await db.collection('weeks').find({
      votingStartDate: { $gte: new Date('2025-09-20') }
    }).sort({ weekNumber: -1 }).toArray();

    for (const week of weeks) {
      console.log(`Semana #${week.weekNumber}: ${week.name}`);
      console.log(`  - ID: ${week._id}`);
      console.log(`  - Estado: ${week.status}`);
      console.log(`  - Votación activa: ${week.isVotingActive ? 'SÍ' : 'NO'}`);
      console.log(`  - Inicio votación: ${week.votingStartDate.toLocaleString('es-ES')}`);
      console.log(`  - Fin votación: ${week.votingEndDate.toLocaleString('es-ES')}`);
      console.log(`  - Total votos (según results): ${week.results?.totalVotes?.toLocaleString() || 0}`);
      console.log('');
    }

    // 4. Comparar totales
    console.log('\n🔍 COMPARACIÓN DE TOTALES:\n');
    const totalVotesCount = votesByWeek.reduce((sum, item) => sum + item.count, 0);
    const totalPointsSum = votesByWeek.reduce((sum, item) => sum + item.totalPoints, 0);

    console.log(`Total votos (documentos) últimos 5 días: ${totalVotesCount.toLocaleString()}`);
    console.log(`Total puntos últimos 5 días: ${totalPointsSum.toLocaleString()}`);

    // Total de la semana activa
    const activeWeek = weeks.find(w => w.isVotingActive);
    if (activeWeek) {
      const activeWeekVotes = votesByWeek.find(v => v._id?.toString() === activeWeek._id.toString());
      console.log(`\nSemana activa (#${activeWeek.weekNumber}): ${activeWeek.name}`);
      console.log(`  - Votos según script: ${activeWeekVotes?.count?.toLocaleString() || 0}`);
      console.log(`  - Puntos según script: ${activeWeekVotes?.totalPoints?.toLocaleString() || 0}`);
      console.log(`  - Votos según week.results: ${activeWeek.results?.totalVotes?.toLocaleString() || 0}`);
      console.log(`  - Diferencia: ${(activeWeekVotes?.totalPoints || 0) - (activeWeek.results?.totalVotes || 0)}`);
    }

    console.log('\n✅ Análisis completado');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Desconectado de MongoDB');
  }
}

checkVotesDistribution();

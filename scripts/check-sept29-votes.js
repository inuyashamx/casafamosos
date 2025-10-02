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

async function checkSept29Votes() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(envVars.MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    // Analizar votos del 29/9 por hora y weekId
    console.log('📊 VOTOS DEL 29 DE SEPTIEMBRE POR HORA Y WEEK_ID:\n');

    const sept29Start = new Date('2025-09-29T00:00:00.000Z');
    const sept29End = new Date('2025-09-30T00:00:00.000Z');

    const votesBySept29 = await db.collection('votes').aggregate([
      {
        $match: {
          voteDate: { $gte: sept29Start, $lt: sept29End },
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

    console.log('Votos del 29/9 distribuidos por weekId:\n');

    for (const item of votesBySept29) {
      const week = await db.collection('weeks').findOne({ _id: item._id });

      console.log(`WeekId: ${item._id}`);
      console.log(`  Semana: #${week?.weekNumber} - ${week?.name}`);
      console.log(`  Estado de la semana: ${week?.status}`);
      console.log(`  Votación activa: ${week?.isVotingActive ? 'SÍ' : 'NO'}`);
      console.log(`  Votos: ${item.count.toLocaleString()}`);
      console.log(`  Puntos: ${item.totalPoints.toLocaleString()}`);
      console.log(`  Primer voto del 29/9: ${item.minDate.toLocaleString('es-ES')}`);
      console.log(`  Último voto del 29/9: ${item.maxDate.toLocaleString('es-ES')}`);
      console.log('');
    }

    // Analizar votos por hora del 29/9
    console.log('\n⏰ VOTOS DEL 29/9 POR HORA:\n');

    const votesByHour = await db.collection('votes').aggregate([
      {
        $match: {
          voteDate: { $gte: sept29Start, $lt: sept29End },
          isValid: true
        }
      },
      {
        $project: {
          hour: { $hour: '$voteDate' },
          weekId: 1,
          points: 1
        }
      },
      {
        $group: {
          _id: {
            hour: '$hour',
            weekId: '$weekId'
          },
          count: { $sum: 1 },
          totalPoints: { $sum: '$points' }
        }
      },
      { $sort: { '_id.hour': 1, '_id.weekId': 1 } }
    ]).toArray();

    const week12Id = '68d4cc9f606499c444196f5f';
    const week13Id = '68da112c5c454235a488bae4';

    for (let hour = 0; hour < 24; hour++) {
      const hourVotes = votesByHour.filter(v => v._id.hour === hour);

      if (hourVotes.length > 0) {
        console.log(`Hora ${hour}:00 - ${hour}:59:`);

        for (const vote of hourVotes) {
          const weekNum = vote._id.weekId.toString() === week12Id ? '#12' :
                         vote._id.weekId.toString() === week13Id ? '#13' :
                         'Otra';

          console.log(`  Semana ${weekNum}: ${vote.count.toLocaleString()} votos, ${vote.totalPoints.toLocaleString()} puntos`);
        }
        console.log('');
      }
    }

    console.log('\n✅ Análisis completado');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Desconectado de MongoDB');
  }
}

checkSept29Votes();

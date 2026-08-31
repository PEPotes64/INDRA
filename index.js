const { Client, GatewayIntentBits } = require('discord.js');
const mongoose = require('mongoose');
require('dotenv').config();

const UserXP = require('./UserXP.js'); // Asegúrate de tener tu modelo en este archivo

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('¡Base de datos de INDRA conectada al centavo! > < :v'))
  .catch(err => console.error('Error al conectar a MongoDB:', err));

client.once('ready', () => {
  console.log(`¡Bot encendido como ${client.user.tag}! Ya estamos listos en el server > < :v`);
});

client.on('messageCreate', async (message) => {
  // Ignorar mensajes de bots o mensajes que no sean de un servidor
  if (message.author.bot || !message.guild) return;

  const userId = message.author.id;
  const guildId = message.guild.id;

  try {
    // Buscar si el usuario ya tiene registro en la base de datos
    let userXpData = await UserXP.findOne({ userId, guildId });

    if (!userXpData) {
      // Si no existe, lo creamos desde cero
      userXpData = new UserXP({ userId, guildId, xp: 0, level: 1 });
    }

    // Dar una cantidad aleatoria de XP por mensaje (ej: entre 15 y 25)
    const xpGanada = Math.floor(Math.random() * 11) + 15;
    userXpData.xp += xpGanada;

    // Fórmula simple para subir de nivel (Nivel actual * 100 XP necesaria)
    const xpNecesaria = userXpData.level * 100;

    if (userXpData.xp >= xpNecesaria) {
      userXpData.level += 1;
      userXpData.xp -= xpNecesaria; // Reinicia el sobrante o déjalo acumulado según prefieras
      message.channel.sheets || message.channel.send(`¡Enhorabuena <@${userId}>! Has subido al **nivel ${userXpData.level}** por tu actividad en INDRA > < :v`);
    }

    // Guardar los cambios en MongoDB
    await userXpData.save();

  } catch (error) {
    console.error('Error al procesar la XP:', error);
  }
});

client.login(process.env.DISCORD_TOKEN);


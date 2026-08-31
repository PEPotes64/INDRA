const http = require('http');
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('¡Zeus vive y está al centavo! > < :v\n');
}).listen(process.env.PORT || 3000);

const { Client, GatewayIntentBits } = require('discord.js');
const mongoose = require('mongoose');
require('dotenv').config();

const UserXP = require('./UserXP.js');

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

client.once('ready', async () => {
  console.log(`¡Bot encendido como ${client.user.tag}! Zeus ya está rifando > < :v`);

  const data = {
    name: 'añadir-xp',
    description: 'Añade XP a un usuario de forma administrativa',
    options: [
      {
        name: 'usuario',
        type: 6,
        description: 'El usuario al que le vas a dar XP',
        required: true
      },
      {
        name: 'cantidad',
        type: 4,
        description: 'Cantidad de XP a sumar',
        required: true
      }
    ]
  };

  try {
    await client.application.commands.create(data);
    console.log('¡Comando /añadir-xp registrado al centavo! :v');
  } catch (error) {
    console.error('Error al registrar comando:', error);
  }
});

// Sistema de XP por mensajes
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  const userId = message.author.id;
  const guildId = message.guild.id;

  try {
    let userXpData = await UserXP.findOne({ userId, guildId });

    if (!userXpData) {
      userXpData = new UserXP({ userId, guildId, xp: 0, level: 1 });
    }

    const xpGanada = Math.floor(Math.random() * 11) + 15;
    userXpData.xp += xpGanada;

    const xpNecesaria = userXpData.level * 100;

    if (userXpData.xp >= xpNecesaria) {
      userXpData.level += 1;
      userXpData.xp -= xpNecesaria;
      message.channel.send(`¡Enhorabuena <@${userId}>! Has subido al **nivel ${userXpData.level}** por tu actividad en el server > < :v`);
    }

    await userXpData.save();

  } catch (error) {
    console.error('Error al procesar la XP:', error);
  }
});

// Escuchar el comando slash /añadir-xp
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'añadir-xp') {
    if (!interaction.member.permissions.has('Administrator')) {
      return interaction.reply({ content: '¡Nel, no tienes permisos de Administrador para usar esto, carnal > < :v!', ephemeral: true });
    }

    const targetUser = interaction.options.getUser('usuario');
    const cantidad = interaction.options.getInteger('cantidad');

    try {
      let userXpData = await UserXP.findOne({ userId: targetUser.id, guildId: interaction.guild.id });

      if (!userXpData) {
        userXpData = new UserXP({ userId: targetUser.id, guildId: interaction.guild.id, xp: 0, level: 1 });
      }

      userXpData.xp += cantidad;
      
      const xpNecesaria = userXpData.level * 100;
      if (userXpData.xp >= xpNecesaria) {
        userXpData.level += 1;
        userXpData.xp -= xpNecesaria;
      }

      await userXpData.save();

      await interaction.reply(`¡Se le sumaron ${cantidad} de XP a <@${targetUser.id}> al centavo! Nivel actual: **${userXpData.level}**, XP: **${userXpData.xp}** > < :v`);

    } catch (error) {
      console.error('Error con el slash command:', error);
      await interaction.reply({ content: 'Hubo un error al procesar la XP, carnal :v', ephemeral: true });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
  

const http = require('http');
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Zeus vive y está al centavo! > < :v\n');
}).listen(process.env.PORT || 3000);

const { Client, GatewayIntentBits, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const mongoose = require('mongoose');
const Canvas = require('canvas');
const path = require('path');
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
  .then(() => console.log('Base de datos de INDRA conectada al centavo! > < :v'))
  .catch(err => console.error('Error al conectar a MongoDB:', err));

client.once('ready', async () => {
  console.log(`Bot encendido como ${client.user.tag}! Zeus ya está rifando > < :v`);

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
        name: 'cant',
        type: 4,
        description: 'Cantidad de XP a sumar',
        required: true
      }
    ]
  };

  try {
    await client.application.commands.create(data);
    console.log('Comando /añadir-xp registrado al centavo! :v');
  } catch (error) {
    console.error('Error al registrar comando:', error);
  }
});

// Función para generar la tarjeta de rango con Canvas
async function generarRankCard(user, xpData) {
  const canvas = Canvas.createCanvas(900, 250);
  const ctx = canvas.getContext('2d');

  // Carga la imagen de tormenta que subiste a GitHub
  const background = await Canvas.loadImage(path.join(__dirname, 'image_14.jpg'));
  ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

  // Capa oscura semitransparente para que resalte el texto
  ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Avatar circular del usuario
  const avatarUrl = user.displayAvatarURL({ extension: 'png', size: 256 });
  const avatar = await Canvas.loadImage(avatarUrl);

  const avatarX = 40;
  const avatarY = 50;
  const avatarRadius = 75;

  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarX + avatarRadius, avatarY + avatarRadius, avatarRadius, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(avatar, avatarX, avatarY, avatarRadius * 2, avatarRadius * 2);
  ctx.restore();

  // Borde blanco del avatar
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();

  // Textos de la tarjeta
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';

  ctx.font = 'bold 36px sans-serif';
  ctx.fillText(user.username, 230, 100);

  ctx.font = 'bold 28px sans-serif';
  ctx.fillText(`NIVEL ${xpData.level}`, 230, 150);

  ctx.font = '22px sans-serif';
  ctx.fillText(`XP: ${xpData.xp} / ${xpData.level * 100}`, 230, 200);

  return canvas.toBuffer();
}

// Sistema de XP por mensajes y subida de nivel
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
      await userXpData.save();

      // Generar tarjeta de rango
      const buffer = await generarRankCard(message.author, userXpData);
      const attachment = new AttachmentBuilder(buffer, { name: 'rank-card.jpg' });

      const levelEmbed = new EmbedBuilder()
        .setColor('#00ffcc')
        .setTitle('# ¡SUBIDA DE NIVEL! ⚡')
        .setDescription(`# ¡Felicidades <@${userId}>! Has roto tus límites en el servidor!🆙`)
        .setImage('attachment://rank-card.jpg')
        .setFooter({ text: 'Sistema de XP • Zeus', iconURL: client.user.displayAvatarURL() });

      await message.channel.send({ embeds: [levelEmbed], files: [attachment] });
    }

    await userXpData.save();
  } catch (error) {
    console.error('Error al procesar la XP:', error);
  }
});

// Manejo del comando /añadir-xp
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'añadir-xp') {
    const targetUser = interaction.options.getUser('usuario');
    const cantidad = interaction.options.getInteger('cant');
    const guildId = interaction.guild.id;
    const userId = targetUser.id;

    let userXpData = await UserXP.findOne({ userId, guildId });
    if (!userXpData) {
      userXpData = new UserXP({ userId, guildId, xp: 0, level: 1 });
    }

    userXpData.xp += cantidad;
    
    // Auto-nivel por si se pasa de la raya con la XP añadida
    while (userXpData.xp >= userXpData.level * 100) {
      userXpData.xp -= userXpData.level * 100;
      userXpData.level += 1;
    }

    await userXpData.save();

    const buffer = await generarRankCard(targetUser, userXpData);
    const attachment = new AttachmentBuilder(buffer, { name: 'rank-card.jpg' });

    const adminEmbed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('# ⚡ Actualización de XP Administrativa')
      .setDescription(`# Se han sumado **+${cantidad} de XP** a <@${userId}>.`)
      .setImage('attachment://rank-card.jpg')
      .setFooter({ text: 'Panel de Administración • Zeus', iconURL: client.user.displayAvatarURL() });

    await interaction.reply({ embeds: [adminEmbed], files: [attachment] });
  }
});

client.login(process.env.DISCORD_TOKEN);
      

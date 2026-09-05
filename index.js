const http = require('http');
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Zeus vive y está al centavo! > < :v\n');
}).listen(process.env.PORT || 3000);

const { Client, GatewayIntentBits, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const mongoose = require('mongoose');
const Canvas = require('canvas');
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
  .then(() => console.log('Base de datos conectada al centavo! > < :v'))
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

// Función para generar la tarjeta de rango en formato JPEG (sin errores de fondo negro en la app de Discord)
async function generarRankCard(user, xpData) {
  const canvas = Canvas.createCanvas(900, 250);
  const ctx = canvas.getContext('2d');

  // Fondo con degradado eléctrico de tormenta
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#0b0f19');
  gradient.addColorStop(0.5, '#162238');
  gradient.addColorStop(1, '#05070b');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Destellos sutiles de rayos en el fondo
  ctx.strokeStyle = 'rgba(0, 255, 204, 0.25)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(120, 0); ctx.lineTo(180, 250);
  ctx.moveTo(720, 0); ctx.lineTo(660, 250);
  ctx.stroke();

  const avatarX = 40;
  const avatarY = 50;
  const avatarRadius = 75;

  // Círculo de respaldo por si el avatar tarda en cargar
  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarX + avatarRadius, avatarY + avatarRadius, avatarRadius, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.fillStyle = '#1f2937';
  ctx.fill();
  ctx.restore();

  // Avatar circular del usuario
  try {
    const avatarUrl = user.displayAvatarURL({ extension: 'png', size: 256 });
    const avatar = await Canvas.loadImage(avatarUrl);

    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarRadius, avatarY + avatarRadius, avatarRadius, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, avatarX, avatarY, avatarRadius * 2, avatarRadius * 2);
    ctx.restore();
  } catch (e) {
    console.error('Error al cargar avatar:', e);
  }

  // Borde brillante del avatar
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#00ffcc';
  ctx.beginPath();
  ctx.arc(avatarX + avatarRadius, avatarY + avatarRadius, avatarRadius, 0, Math.PI * 2, true);
  ctx.stroke();

  // Textos limpios y nítidos
  ctx.textAlign = 'left';

  ctx.font = 'bold 36px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(user.username, 230, 95);

  ctx.font = 'bold 28px sans-serif';
  ctx.fillStyle = '#FFD700';
  ctx.fillText(`NIVEL ${xpData.level}`, 230, 145);

  ctx.font = '22px sans-serif';
  ctx.fillStyle = '#00ffcc';
  ctx.fillText(`XP: ${xpData.xp} / ${xpData.level * 100}`, 230, 195);

  // Retornamos en JPEG para que preserve el degradado y Discord lo pinte bien
  return canvas.toBuffer('image/jpeg', { quality: 0.95 });
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

      const buffer = await generarRankCard(message.author, userXpData);
      const attachment = new AttachmentBuilder(buffer, { name: 'rank-card.jpg' });

      const levelEmbed = new EmbedBuilder()
        .setColor('#00ffcc')
        .setTitle('⚡ SUBIDA DE NIVEL ⚡')
        .setDescription(`# ¡Felicidades <@${userId}>!\nHas alcanzado el nivel **${userXpData.level}**`)
        .setImage('attachment://rank-card.jpg')
        .setFooter({ text: 'Sistema de XP • Zeus', iconURL: client.user.displayAvatarURL() });

      await message.channel.send({ embeds: [levelEmbed], files: [attachment] });
    }

    await userXpData.save();
  } catch (error) {
    console.error('Error al procesar la XP:', error);
  }
});

// Manejo del comando /añadir-xp con deferReply
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'añadir-xp') {
    await interaction.deferReply();

    const targetUser = interaction.options.getUser('usuario');
    const cantidad = interaction.options.getInteger('cant');
    const guildId = interaction.guild.id;
    const userId = targetUser.id;

    let userXpData = await UserXP.findOne({ userId, guildId });
    if (!userXpData) {
      userXpData = new UserXP({ userId, guildId, xp: 0, level: 1 });
    }

    userXpData.xp += cantidad;
    
    while (userXpData.xp >= userXpData.level * 100) {
      userXpData.xp -= userXpData.level * 100;
      userXpData.level += 1;
    }

    await userXpData.save();

    const buffer = await generarRankCard(targetUser, userXpData);
    const attachment = new AttachmentBuilder(buffer, { name: 'rank-card.jpg' });

    const adminEmbed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('⚡ Actualización de XP Administrativa')
      .setDescription(`# ¡Listo <@${userId}>!\nSe sumaron **+${cantidad} XP**. Nivel actual: **${userXpData.level}**`)
      .setImage('attachment://rank-card.jpg')
      .setFooter({ text: 'Panel de Administración • Zeus', iconURL: client.user.displayAvatarURL() });

    await interaction.editReply({ embeds: [adminEmbed], files: [attachment] });
  }
});

client.login(process.env.DISCORD_TOKEN);


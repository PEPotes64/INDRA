const http = require('http');
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Zeus vive y está al centavo! > < :v');
}).listen(process.env.PORT || 3000);

const { Client, GatewayIntentBits, EmbedBuilder, AttachmentBuilder, ApplicationCommandOptionType } = require('discord.js');
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

  // Registro del único comando que necesitamos
  const dataAddXp = {
    name: 'añadir-xp',
    description: 'Añade XP a un usuario de forma administrativa',
    options: [
      {
        name: 'usuario',
        type: ApplicationCommandOptionType.User,
        description: 'El usuario al que le vas a dar XP',
        required: true,
      },
      {
        name: 'cant',
        type: ApplicationCommandOptionType.Integer,
        description: 'Cantidad de XP a sumar',
        required: true,
      }
    ]
  };

  try {
    await client.application.commands.create(dataAddXp);
    console.log('Comandos registrados al centavo! > < :v');
  } catch (error) {
    console.error('Error al registrar comandos:', error);
  }
});

async function generarRankCard(user, xpData) {
  const canvas = Canvas.createCanvas(900, 250);
  const ctx = canvas.getContext('2d');

  // Limpiamos todo para que sea transparente
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const avatarX = 45;
  const avatarY = 35;
  const avatarRadius = 90; // Avatar más grandote y vistoso

  // Círculo de respaldo del avatar
  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarX + avatarRadius, avatarY + avatarRadius, avatarRadius, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.fillStyle = '#1f2937';
  ctx.fill();
  ctx.restore();

  // Avatar circular del usuario
  try {
    const avatarUrl = user.displayAvatarURL({ extension: 'png', size: 512 });
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
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#00ffcc';
  ctx.beginPath();
  ctx.arc(avatarX + avatarRadius, avatarY + avatarRadius, avatarRadius, 0, Math.PI * 2, true);
  ctx.stroke();

  // Sombra perrona para que los textos resalten bien macizo
  ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 3;
  ctx.shadowOffsetY = 3;

  // Textos grandes y legibles al centavo
  ctx.textAlign = 'left';

  // Nombre de usuario (Gigante)
  ctx.font = 'bold 48px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(user.username, 270, 85);

  // Nivel (Amarillo brillante destacado)
  ctx.font = 'bold 36px sans-serif';
  ctx.fillStyle = '#FFD700';
  ctx.fillText(`NIVEL ${xpData.level}`, 270, 145);

  // Barra de XP (Turquesa fosforescente)
  ctx.font = 'bold 30px sans-serif';
  ctx.fillStyle = '#00ffcc';
  ctx.fillText(`XP: ${xpData.xp} / ${xpData.level * 100}`, 270, 200);

  return canvas.toBuffer('image/png', { quality: 0.95 });
}

// Sistema de XP por mensajes
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const userId = message.author.id;
  const guildId = message.guild.id;

  try {
    let userXpData = await UserXP.findOne({ userId, guildId });
    if (!userXpData) {
      userXpData = new UserXP({ userId, guildId, xp: 0, level: 1 });
    }

    const xpGanada = Math.floor(Math.random() * 11) + 15;
    userXpData.xp += xpGanada;
    let xpNecesaria = userXpData.level * 100;

    let subioNivel = false;
    while (userXpData.xp >= xpNecesaria) {
      userXpData.xp -= xpNecesaria;
      userXpData.level += 1;
      xpNecesaria = userXpData.level * 100;
      subioNivel = true;
    }

    await userXpData.save();

    if (subioNivel) {
      const buffer = await generarRankCard(message.author, userXpData);
      const uniqueFileName = `rank-card-${Date.now()}.png`;
      const attachment = new AttachmentBuilder(buffer, { name: uniqueFileName });

      const levelEmbed = new EmbedBuilder()
        .setColor('#00ffcc')
        .setTitle('⚡ SUBIDA DE NIVEL ⚡')
        .setDescription(`# ¡Felicidades <@${userId}>!\nHas alcanzado el nivel **${userXpData.level}** > < :v`)
        .setImage(`attachment://${uniqueFileName}`)
        .setFooter({ text: 'Sistema de xp • Zeus', iconURL: client.user.displayAvatarURL() });

      await message.channel.send({ embeds: [levelEmbed], files: [attachment] });
    }
  } catch (error) {
    console.error('Error al procesar la XP:', error);
  }
});

// Manejo del comando /añadir-xp
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'añadir-xp') {
    await interaction.deferReply();

    const targetUser = interaction.options.getUser('usuario');
    const cantidad = interaction.options.getInteger('cant');
    const guildId = interaction.guild.id;
    const userId = targetUser.id;

    try {
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
      const uniqueFileName = `rank-card-${Date.now()}.png`;
      const attachment = new AttachmentBuilder(buffer, { name: uniqueFileName });

      const adminEmbed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('⚡ Actualización de XP Administrativa')
        .setDescription(`# ¡Listo <@${userId}>!\nSe sumaron **+${cantidad} XP**. Nivel actual: **${userXpData.level}** > < :v`)
        .setImage(`attachment://${uniqueFileName}`)
        .setFooter({ text: 'Panel de Administración • Zeus', iconURL: client.user.displayAvatarURL() });

      await interaction.editReply({ embeds: [adminEmbed], files: [attachment] });
    } catch (error) {
      console.error('Error en /añadir-xp:', error);
      await interaction.editReply('¡Puchica, algo salió mal al procesar la XP > < :v!');
    }
  }
});

client.login(process.env.DISCORD_TOKEN);

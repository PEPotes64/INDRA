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

// Modelo de Mongoose integrado directo aquí para guardar el fondo en base64
const backgroundSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  imageBuffer: { type: String, required: true }
});
const Background = mongoose.models.Background || mongoose.model('Background', backgroundSchema);

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

  // Registro de comandos
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

  const dataSetBg = {
    name: 'setbg',
    description: 'Sube una imagen para usarla como fondo en la Rank Card',
    options: [
      {
        name: 'imagen',
        type: ApplicationCommandOptionType.Attachment,
        description: 'Sube la imagen de fondo (ej: image_14.jpg)',
        required: true,
      }
    ]
  };

  try {
    await client.application.commands.create(dataAddXp);
    await client.application.commands.create(dataSetBg);
    console.log('Comandos registrados al centavo! > < :v');
  } catch (error) {
    console.error('Error al registrar comandos:', error);
  }
});

// Función para generar la tarjeta jalando el fondo desde MongoDB
async function generarRankCard(user, xpData, guildId) {
  const canvas = Canvas.createCanvas(900, 250);
  const ctx = canvas.getContext('2d');

  try {
    // Buscamos el fondo guardado en Mongo para este servidor
    const bgConfig = await Background.findOne({ guildId });
    if (bgConfig && bgConfig.imageBuffer) {
      const bgImage = await Canvas.loadImage(bgConfig.imageBuffer);
      ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
    } else {
      // Fondo negro de respaldo si no han configurado imagen
      ctx.fillStyle = '#0b0f19';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  } catch (e) {
    console.error('Error al cargar la imagen de Mongo:', e);
    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Capa oscura para que los textos resalten chido
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const avatarX = 40;
  const avatarY = 50;
  const avatarRadius = 75;

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

  return canvas.toBuffer('image/jpeg', { quality: 0.95 });
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
      const buffer = await generarRankCard(message.author, userXpData, guildId);
      const uniqueFileName = `rank-card-${Date.now()}.jpg`;
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

// Manejo de comandos (añadir-xp y setbg)
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  // Comando /setbg para guardar la imagen en MongoDB
  if (interaction.commandName === 'setbg') {
    await interaction.deferReply({ ephemeral: true });
    const attachment = interaction.options.getAttachment('imagen');
    const guildId = interaction.guild.id;

    if (!attachment.contentType || !attachment.contentType.startsWith('image/')) {
      return interaction.editReply('¡Puchica, Pepo! Tienes que subir un archivo de imagen válido > < :v');
    }

    try {
      // Descargamos la imagen como buffer desde Discord y la convertimos a Base64
      const response = await fetch(attachment.url);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64Image = `data:${attachment.contentType};base64,${buffer.toString('base64')}`;

      // Guardamos o actualizamos en MongoDB para este servidor
      await Background.findOneAndUpdate(
        { guildId },
        { imageBuffer: base64Image },
        { upsert: true, new: true }
      );

      await interaction.editReply('¡Fondo guardado en MongoDB al centavo! Ya puedes usar tus comandos de XP y se verá chido > < :v');
    } catch (error) {
      console.error('Error al guardar el fondo:', error);
      interaction.editReply('Hubo un error al guardar la imagen en la base de datos > < :v');
    }
  }

  // Comando /añadir-xp
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

      const buffer = await generarRankCard(targetUser, userXpData, guildId);
      const uniqueFileName = `rank-card-${Date.now()}.jpg`;
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
          

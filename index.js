const http = require('http');
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Zeus ta vivo maje! > < :v');
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

// Koneztando la base de datos compa
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Base de datos conectada al 100 > < :v'))
  .catch(err => console.error('Puchica fallo la base de datos:', err));

client.once('ready', async () => {
  console.log(`Bot prendido como ${client.user.tag}! Zeus ya anda zumbando > < :v`);

  // Aki nomas keda el comando d dar XP
  const dataAddXp = {
    name: 'añadir-xp',
    description: 'Añade XP a un maje',
    options: [
      {
        name: 'usuario',
        type: ApplicationCommandOptionType.User,
        description: 'El chavo al q le daras XP',
        required: true,
      },
      {
        name: 'cant',
        type: ApplicationCommandOptionType.Integer,
        description: 'Kuantos puntos le vas a dar',
        required: true,
      }
    ]
  };

  try {
    await client.application.commands.create(dataAddXp);
    console.log('Comandos listos compa > < :v');
  } catch (error) {
    console.error('Error con los comandos:', error);
  }
});

// LA NUEBA FUNSION CHILERA Y SENSILA Q ISIMOS DESDE SERO
async function generarRankCard(user, xpData) {
  const canvas = Canvas.createCanvas(800, 250);
  const ctx = canvas.getContext('2d');

  // Fondo gris solido pa q no de clavos de transparnsia
  ctx.fillStyle = '#2b2d31'; 
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.textAlign = 'left';

  // Letrotas blankas del ombre
  ctx.fillStyle = '#ffffff'; 
  ctx.font = 'bold 45px sans-serif';
  ctx.fillText(user.username, 250, 90);

  // El nibel en amariyo
  ctx.fillStyle = '#FFD700'; 
  ctx.font = 'bold 35px sans-serif';
  ctx.fillText('NIVEL: ' + xpData.level, 250, 150);

  // La XP en turkesa
  ctx.fillStyle = '#00ffcc'; 
  ctx.font = 'bold 30px sans-serif';
  ctx.fillText('XP: ' + xpData.xp + ' / ' + (xpData.level * 100), 250, 200);

  // Avatar asi nomas, en cuadradito y pelado
  try {
    const avatarUrl = user.displayAvatarURL({ extension: 'png', size: 256 });
    const avatar = await Canvas.loadImage(avatarUrl);
    ctx.drawImage(avatar, 40, 35, 180, 180);
  } catch (error) {
    console.log('No cargo la foto del cerote:', error);
  }

  return canvas.toBuffer('image/png');
}

// Kuando ablan y ganan xp
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
      const uniqueFileName = `rank-${Date.now()}.png`; // Con nombre chafa pa q no se trave el cache
      const attachment = new AttachmentBuilder(buffer, { name: uniqueFileName });

      const levelEmbed = new EmbedBuilder()
        .setColor('#00ffcc')
        .setTitle('⚡ ZUBIO DE NIVEL ⚡')
        .setDescription(`# Wena <@${userId}>!\nLlegaste al nivel **${userXpData.level}** > < :v`)
        .setImage(`attachment://${uniqueFileName}`)
        .setFooter({ text: 'Sistema de xp • Zeus', iconURL: client.user.displayAvatarURL() });

      await message.channel.send({ embeds: [levelEmbed], files: [attachment] });
    }
  } catch (error) {
    console.error('Clavo con la XP:', error);
  }
});

// El comando slash pa los admines
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
      const uniqueFileName = `rank-${Date.now()}.png`; // Rompiendo el cache de nuwebo
      const attachment = new AttachmentBuilder(buffer, { name: uniqueFileName });

      const adminEmbed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('⚡ XP PUESTA POR EL ADMIN')
        .setDescription(`# Ya kedo <@${userId}>!\nTe zume **+${cantidad} XP**. Nivel actual: **${userXpData.level}** > < :v`)
        .setImage(`attachment://${uniqueFileName}`)
        .setFooter({ text: 'Panel de Administración • Zeus', iconURL: client.user.displayAvatarURL() });

      await interaction.editReply({ embeds: [adminEmbed], files: [attachment] });
    } catch (error) {
      console.error('Clavo en /añadir-xp:', error);
      await interaction.editReply('Puchica algo trono feo > < :v');
    }
  }
});

client.login(process.env.DISCORD_TOKEN);

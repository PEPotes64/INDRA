const http = require('http');
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Zeus ta vivo y al centavo maje! > < :v');
}).listen(process.env.PORT || 3000);

const { Client, GatewayIntentBits, EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
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

// Koneztando la base de datos compa
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Base de datos conectada al 100 > < :v'))
  .catch(err => console.error('Puchica fallo la base de datos:', err));

client.once('ready', async () => {
  console.log(`Bot prendido como ${client.user.tag}! Zeus ya anda zumbando > < :v`);

  const dataAddXp = {
    name: 'añadir-xp',
    description: 'Añade XP a un maje y resetea',
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

// Sistema de XP avanzado según el contenido que mande la mara
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const userId = message.author.id;
  const guildId = message.guild.id;

  let xpGanada = 1; // Por defecto el texto vale 1 XP

  if (message.attachments.size > 0) {
    const attachment = message.attachments.first();
    const tipo = attachment.contentType || '';

    if (tipo.startsWith('image/')) {
      xpGanada = 3; // Imagen: 3 XP
    } else if (tipo.startsWith('video/')) {
      xpGanada = 4; // Video: 4 XP
    } else if (tipo.startsWith('audio/')) {
      xpGanada = 2; // Audio: 2 XP
    }
  } 
  else if (message.content.includes('giphy.com') || message.content.includes('tenor.com') || message.embeds.some(e => e.type === 'gifv')) {
    xpGanada = 2; // GIF: 2 XP
  } 
  else if (/<a?:\w+:\d+>/.test(message.content)) {
    xpGanada = 1 + (message.content.match(/<a?:\w+:\d+>/g) || []).length; // Emoji: 1 XP c/u
  }

  try {
    let userXpData = await UserXP.findOne({ userId, guildId });
    if (!userXpData) {
      userXpData = new UserXP({ userId, guildId, xp: 0, level: 0 });
    }

    userXpData.xp += xpGanada;
    let xpNecesaria = (userXpData.level + 1) * 100;

    let subioNivel = false;
    while (userXpData.xp >= xpNecesaria) {
      userXpData.xp -= xpNecesaria;
      userXpData.level += 1;
      xpNecesaria = (userXpData.level + 1) * 100;
      subioNivel = true;
    }

    await userXpData.save();

    if (subioNivel) {
      const levelEmbed = new EmbedBuilder()
        .setColor('#00ffcc')
        .setAuthor({ name: `¡Subida de Nivel!`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true, size: 512 }))
        .setDescription(`<@${userId}> Haz sido ayudado por Zeus, subiste de nivel chatio 🔥`)
        .addFields(
          { name: '⛈️Tu Nuevo nivel es:', value: `**${userXpData.level}**`, inline: true },
          { name: '⚡Esta es tu XP:', value: `**${userXpData.xp} / ${(userXpData.level + 1) * 100}**`, inline: true }
        )
        .setFooter({ text: 'Sistema de XP • Zeus', iconURL: client.user.displayAvatarURL() });

      await message.channel.send({ embeds: [levelEmbed] });
    }
  } catch (error) {
    console.error('Clavo con la XP:', error);
  }
});

// El comando slash pa los admines con reseteo y textos personalizados
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
        userXpData = new UserXP({ userId, guildId, xp: 0, level: 0 });
      } else {
        userXpData.xp = 0;
        userXpData.level = 0;
      }

      userXpData.xp += cantidad;

      while (userXpData.xp >= (userXpData.level + 1) * 100) {
        userXpData.xp -= (userXpData.level + 1) * 100;
        userXpData.level += 1;
      }

      await userXpData.save();

      const adminEmbed = new EmbedBuilder()
        .setColor('#FFD700')
        .setAuthor({ name: `XP Puesta por Admin`, iconURL: targetUser.displayAvatarURL({ dynamic: true }) })
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 512 }))
        .setDescription(`<@${userId}> Haz sido ayudado por Zeus, se te sumaron **+${cantidad} XP**`)
        .addFields(
          { name: '⛈️Tu Nuevo nivel es:', value: `**${userXpData.level}**`, inline: true },
          { name: '⚡Esta es tu XP:', value: `**${userXpData.xp} / ${(userXpData.level + 1) * 100}**`, inline: true }
        )
        .setFooter({ text: 'Panel de Administración • Zeus', iconURL: client.user.displayAvatarURL() });

      await interaction.editReply({ embeds: [adminEmbed] });
    } catch (error) {
      console.error('Clavo en /añadir-xp:', error);
      await interaction.editReply('Puchica algo trono feo con la base de datos > < :v');
    }
  }
});

client.login(process.env.DISCORD_TOKEN);


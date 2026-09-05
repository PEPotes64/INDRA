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
      // Usamos un embed pro en ves de imagen chafa
      const levelEmbed = new EmbedBuilder()
        .setColor('#00ffcc')
        .setAuthor({ name: `¡Subida de Nivel!`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true, size: 512 }))
        .setDescription(`Wena <@${userId}>! Anda puro fuego cerote 🔥`)
        .addFields(
          { name: '🌟 Nivel Alcanzado', value: `**${userXpData.level}**`, inline: true },
          { name: '✨ XP Actual', value: `**${userXpData.xp} / ${userXpData.level * 100}**`, inline: true }
        )
        .setFooter({ text: 'Sistema de XP • Zeus', iconURL: client.user.displayAvatarURL() });

      await message.channel.send({ embeds: [levelEmbed] });
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

      // Embed perron de confirmacion en ves de imagen
      const adminEmbed = new EmbedBuilder()
        .setColor('#FFD700')
        .setAuthor({ name: `XP Puesta por Admin`, iconURL: targetUser.displayAvatarURL({ dynamic: true }) })
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 512 }))
        .setDescription(`Ya kedo maje <@${userId}>! Se sumaron **+${cantidad} XP**`)
        .addFields(
          { name: '📈 Nuevo Nivel', value: `**${userXpData.level}**`, inline: true },
          { name: '⚡ Progreso', value: `**${userXpData.xp} / ${userXpData.level * 100}**`, inline: true }
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
    

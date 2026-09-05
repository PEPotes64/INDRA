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

const nivelesRoles = [
  { min: 1000, max: 99999, id: '1545889068963860480' },
  { min: 850, max: 999, id: '1545888858426703932' },
  { min: 800, max: 849, id: '1545888736145838201' },
  { min: 750, max: 799, id: '1545888446151663636' },
  { min: 700, max: 749, id: '1545888262109790348' },
  { min: 650, max: 699, id: '1545887696977657916' },
  { min: 600, max: 649, id: '1545886582706544770' },
  { min: 550, max: 599, id: '1545886425717805086' },
  { min: 500, max: 549, id: '1545886299985158194' },
  { min: 450, max: 499, id: '1545886123765669938' },
  { min: 400, max: 449, id: '1545885802179985539' },
  { min: 350, max: 399, id: '1545885424424059043' },
  { min: 300, max: 349, id: '1545885295554207884' },
  { min: 250, max: 299, id: '1545884764438011986' },
  { min: 200, max: 249, id: '1545884525395976263' },
  { min: 150, max: 199, id: '1545884262132228217' },
  { min: 125, max: 149, id: '1545883901098991666' },
  { min: 100, max: 124, id: '1545881490582147112' },
  { min: 80, max: 99, id: '1545881103158747196' },
  { min: 70, max: 79, id: '1359367583001870378' },
  { min: 60, max: 69, id: '1359366992628289566' },
  { min: 50, max: 59, id: '1359366824801865830' },
  { min: 40, max: 49, id: '1359366460626964510' },
  { min: 30, max: 39, id: '1359366104060788766' },
  { min: 20, max: 29, id: '1359365813416493106' },
  { min: 15, max: 19, id: '1359365597066166383' },
  { min: 10, max: 14, id: '1359365393084448829' },
  { min: 5, max: 9, id: '1359364859333967882' },
  { min: 1, max: 4, id: '1359363942727815269' }
];

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
        description: 'Cuantos puntos le vas a dar',
        required: true,
      }
    ]
  };

  const dataQuitarXp = {
    name: 'quitar-xp',
    description: 'Le quita XP a un maje y le ajusta el nivel',
    options: [
      {
        name: 'usuario',
        type: ApplicationCommandOptionType.User,
        description: 'El chavo al q le quitaras XP',
        required: true,
      },
      {
        name: 'cant',
        type: ApplicationCommandOptionType.Integer,
        description: 'Cuantos puntos le vas a quitar',
        required: true,
      }
    ]
  };

  try {
    await client.application.commands.create(dataAddXp);
    await client.application.commands.create(dataQuitarXp);
    console.log('Comandos listos compa > < :v');
  } catch (error) {
    console.error('Error con los comandos:', error);
  }
});

async function checkearRoles(member, nivelActual, guild) {
  try {
    const rangoEncontrado = nivelesRoles.find(r => nivelActual >= r.min && nivelActual <= r.max);
    if (!rangoEncontrado) return;

    const idsDeNiveles = nivelesRoles.map(r => r.id);
    const rolesAQuitar = member.roles.cache.filter(r => idsDeNiveles.includes(r.id) && r.id !== rangoEncontrado.id);
    
    if (rolesAQuitar.size > 0) {
      await member.roles.remove(rolesAQuitar);
    }

    const rolNuevoObj = guild.roles.cache.get(rangoEncontrado.id);
    if (rolNuevoObj && !member.roles.cache.has(rolNuevoObj.id)) {
      await member.roles.add(rolNuevoObj);
    }
  } catch (err) {
    console.error("Clavo intentando actualizar el rol del maje:", err);
  }
}

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const userId = message.author.id;
  const guildId = message.guild.id;

  let xpGanada = 1;

  if (message.attachments.size > 0) {
    const attachment = message.attachments.first();
    const tipo = attachment.contentType || '';

    if (tipo.startsWith('image/')) {
      xpGanada = 3;
    } else if (tipo.startsWith('video/')) {
      xpGanada = 4;
    } else if (tipo.startsWith('audio/')) {
      xpGanada = 2;
    }
  }
  else if (message.content.includes('giphy.com') || message.content.includes('tenor.com') || message.embeds.some(e => e.type === 'gifv')) {
    xpGanada = 2;
  }
  else if (/<a?:\w+:\d+>/.test(message.content)) {
    xpGanada = 1 + (message.content.match(/<a?:\w+:\d+>/g) || []).length;
  }

  try {
    let userXpData = await UserXP.findOne({ userId, guildId });
    if (!userXpData) {
      userXpData = new UserXP({ userId, guildId, xp: 0, level: 1 });
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
        .setColor('#00ffea')
        .setAuthor({ name: 'Subida de Nivel!', iconURL: message.author.displayAvatarURL({ dynamic: true }) })
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true, size: 512 }))
        .setDescription(`<@${userId}> Haz sido ayudado por Zeus, subiste de nivel chatio 🔥`)
        .addFields(
          { name: '🌟 Tu Nuevo nivel es:', value: `**${userXpData.level}**`, inline: true },
          { name: '✨ Esta es tu XP:', value: `**${userXpData.xp} / ${(userXpData.level + 1) * 100}**`, inline: true }
        )
        .setFooter({ text: 'Sistema de XP • Zeus', iconURL: client.user.displayAvatarURL() });

      await message.channel.send({ embeds: [levelEmbed] });
      
      if(message.member) {
        await checkearRoles(message.member, userXpData.level, message.guild);
      }
    }
  } catch (error) {
    console.error('Clavo con la XP:', error);
  }
});

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

      while (userXpData.xp >= (userXpData.level + 1) * 100) {
        userXpData.xp -= (userXpData.level + 1) * 100;
        userXpData.level += 1;
      }

      await userXpData.save();

      const adminEmbed = new EmbedBuilder()
        .setColor('#ffd700')
        .setAuthor({ name: 'XP Puesta por Admin', iconURL: targetUser.displayAvatarURL({ dynamic: true }) })
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 512 }))
        .setDescription(`<@${userId}> Haz sido ayudado por Zeus, se te sumaron **+${cantidad} XP**`)
        .addFields(
          { name: '🌟 Tu Nuevo nivel es:', value: `**${userXpData.level}**`, inline: true },
          { name: '✨ Esta es tu XP:', value: `**${userXpData.xp} / ${(userXpData.level + 1) * 100}**`, inline: true }
        )
        .setFooter({ text: 'Panel de Administración • Zeus', iconURL: client.user.displayAvatarURL() });

      await interaction.editReply({ embeds: [adminEmbed] });
      
      const member = interaction.guild.members.cache.get(userId);
      if(member) {
        await checkearRoles(member, userXpData.level, interaction.guild);
      }
      
    } catch (error) {
      console.error('Clavo en añadir-xp:', error);
      await interaction.editReply('Puchica algo trono feo con la base de datos > < :v');
    }
  }

  if (interaction.commandName === 'quitar-xp') {
    await interaction.deferReply();

    const targetUser = interaction.options.getUser('usuario');
    const cantidad = interaction.options.getInteger('cant');
    const guildId = interaction.guild.id;
    const userId = targetUser.id;

    try {
      let userXpData = await UserXP.findOne({ userId, guildId });

      if (!userXpData) {
        await interaction.editReply('Puchica, ese maje ni siquiera tiene registro de XP todavía > < :v');
        return;
      }

      userXpData.xp -= cantidad;

      while (userXpData.xp < 0 && userXpData.level > 1) {
        userXpData.level -= 1;
        let xpAnterior = (userXpData.level + 1) * 100;
        userXpData.xp += xpAnterior;
      }

      if (userXpData.xp < 0) userXpData.xp = 0;

      await userXpData.save();

      const adminEmbed = new EmbedBuilder()
        .setColor('#ff4747')
        .setAuthor({ name: 'XP Quitada por Admin', iconURL: targetUser.displayAvatarURL({ dynamic: true }) })
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 512 }))
        .setDescription(`<@${userId}> Zeus te ha castigado, se te restaron **-${cantidad} XP**`)
        .addFields(
          { name: '🌟 Tu Nivel actual es:', value: `**${userXpData.level}**`, inline: true },
          { name: '✨ Esta es tu XP:', value: `**${userXpData.xp} / ${(userXpData.level + 1) * 100}**`, inline: true }
        )
        .setFooter({ text: 'Panel de Administración • Zeus', iconURL: client.user.displayAvatarURL() });

      await interaction.editReply({ embeds: [adminEmbed] });
      
      const member = interaction.guild.members.cache.get(userId);
      if(member) {
        await checkearRoles(member, userXpData.level, interaction.guild);
      }
      
    } catch (error) {
      console.error('Clavo en quitar-xp:', error);
      await interaction.editReply('Puchica algo trono feo con la base de datos al quitar XP > < :v');
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
      

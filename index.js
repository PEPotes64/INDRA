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
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// 🚀 IDs de los roles de multiplicadores de XP Maje:
const ROL_XP_X4 = '1545949309118316615'; // Poné aquí el ID de tu rol x4 en la línea 22
const ROL_XP_X2 = '1545950431908470865'; // Rol x2 de XP

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

// IDs de los roles de los primeros 3 lugares
const rolesTop3 = [
  '1541902325784912064', // 1er lugar
  '1541902188895412405', // 2do lugar
  '1541899453521330216'  // 3er lugar
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

  const dataVerXp = {
    name: 'xp',
    description: 'Muestra tu nivel y XP actual o la de otro usuario',
    options: [
      {
        name: 'usuario',
        type: ApplicationCommandOptionType.User,
        description: 'El chavo del que quieres ver la XP (opcional)',
        required: false,
      }
    ]
  };

  const dataTop = {
    name: 'top',
    description: 'Muestra el Top 10 de majes con más XP en el servidor',
  };

  try {
    await client.application.commands.create(dataAddXp);
    await client.application.commands.create(dataQuitarXp);
    await client.application.commands.create(dataVerXp);
    await client.application.commands.create(dataTop);
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

// Funcion para actualizar y rotar los roles del Top 3
async function actualizarRolesTop(guild) {
  try {
    const topUsers = await UserXP.find({ guildId: guild.id })
      .sort({ level: -1, xp: -1 })
      .limit(3);

    // 1. Quitamos los roles de top a quienes ya no pertenecen a ese puesto
    for (let i = 0; i < rolesTop3.length; i++) {
      const roleId = rolesTop3[i];
      const role = guild.roles.cache.get(roleId);
      const topUserInIndex = topUsers[i] ? topUsers[i].userId : null;

      if (role) {
        for (const [memberId, member] of role.members) {
          if (memberId !== topUserInIndex) {
            await member.roles.remove(roleId).catch(() => {});
          }
        }
      }
    }

    // 2. Le ponemos el rol exacto a los top 3 actuales
    for (let i = 0; i < topUsers.length; i++) {
      const u = topUsers[i];
      const roleId = rolesTop3[i];
      if (!roleId) continue;

      const member = await guild.members.fetch(u.userId).catch(() => null);
      if (member) {
        const roleObj = guild.roles.cache.get(roleId);
        if (roleObj && !member.roles.cache.has(roleId)) {
          await member.roles.add(roleObj).catch(() => {});
        }
      }
    }
  } catch (err) {
    console.error('Clavo actualizando roles del Top 3:', err);
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

  // ⚡ VERIFICAMOS MULTIPLICADORES DE ROL (XP X4 O XP X2)
  if (message.member) {
    if (message.member.roles.cache.has(ROL_XP_X4)) {
      xpGanada = xpGanada * 4;
    } else if (message.member.roles.cache.has(ROL_XP_X2)) {
      xpGanada = xpGanada * 2;
    }
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
    await actualizarRolesTop(message.guild);

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
      await actualizarRolesTop(interaction.guild);

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
      await actualizarRolesTop(interaction.guild);

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

  if (interaction.commandName === 'xp') {
    await interaction.deferReply();

    const targetUser = interaction.options.getUser('usuario') || interaction.user;
    const guildId = interaction.guild.id;
    const userId = targetUser.id;

    try {
      let userXpData = await UserXP.findOne({ userId, guildId });

      if (!userXpData) {
        userXpData = { xp: 0, level: 1 };
      }

      const xpNecesaria = (userXpData.level + 1) * 100;

      const xpEmbed = new EmbedBuilder()
        .setColor('#3b82f6')
        .setAuthor({ name: `Nivel y XP de ${targetUser.username}`, iconURL: targetUser.displayAvatarURL({ dynamic: true }) })
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 512 }))
        .setDescription(`Consulta de experiencia en el servidor 🔥`)
        .addFields(
          { name: '🌟 Nivel actual:', value: `**${userXpData.level}**`, inline: true },
          { name: '✨ Puntos de XP:', value: `**${userXpData.xp} / ${xpNecesaria}**`, inline: true }
        )
        .setFooter({ text: 'Consulta de XP • Zeus', iconURL: client.user.displayAvatarURL() });

      await interaction.editReply({ embeds: [xpEmbed] });

    } catch (error) {
      console.error('Clavo consultando la XP:', error);
      await interaction.editReply('Puchica algo trono feo al intentar ver la XP > < :v');
    }
  }

  if (interaction.commandName === 'top') {
    await interaction.deferReply();

    const guildId = interaction.guild.id;

    try {
      await actualizarRolesTop(interaction.guild);

      const topUsers = await UserXP.find({ guildId })
        .sort({ level: -1, xp: -1 })
        .limit(10);

      if (!topUsers || topUsers.length === 0) {
        await interaction.editReply('Aún no hay nadie registrado en la tabla de clasificación > < :v');
        return;
      }

      const medallas = ['🥇', '🥈', '🥉'];
      let descripcionTop = '';

      for (let i = 0; i < topUsers.length; i++) {
        const u = topUsers[i];
        const medalla = medallas[i] || `**#${i + 1}**`;
        const maxXP = (u.level + 1) * 100;
        
        descripcionTop += `${medalla} <@${u.userId}> — **Nivel ${u.level}** (${u.xp}/${maxXP} XP)\n`;
      }

      const topEmbed = new EmbedBuilder()
        .setColor('#f59e0b')
        .setTitle('🏆 Leaderboard — Top 10 del Servidor')
        .setThumbnail(interaction.guild.iconURL({ dynamic: true }) || client.user.displayAvatarURL())
        .setDescription(descripcionTop)
        .setFooter({ text: 'Tabla de Clasificación • Zeus', iconURL: client.user.displayAvatarURL() });

      await interaction.editReply({ embeds: [topEmbed] });

    } catch (error) {
      console.error('Clavo en el comando top:', error);
      await interaction.editReply('Puchica algo trono feo al sacar el top de majes > < :v');
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
            

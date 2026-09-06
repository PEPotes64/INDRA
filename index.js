const http = require('http');
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Zeus ta vivo y al centavo maje! > < :v');
}).listen(process.env.PORT || 3000);

const { 
  Client, 
  GatewayIntentBits, 
  EmbedBuilder, 
  ApplicationCommandOptionType,
  StringSelectMenuBuilder,
  ActionRowBuilder
} = require('discord.js');
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

// 🎒 IDs de los roles de multiplicadores y tienda
const ROL_XP_X4 = '1234567890123456789'; // ID de tu rol x4
const ROL_XP_X2 = '1545950431908470865'; // Rol x2 de XP
const ROL_OCULTO = '1545963099788410950'; // Rol de canales ocultos

const nivelesRoles = [
  { min: 1000, max: 99999, id: '1545889068963860480' },
  { min: 850, max: 999, id: '1545888858426703932' },
  { min: 800, max: 849, id: '1545888736145838201' },
  { min: 750, max: 799, id: '1545888446151663636' },
  { min: 700, max: 749, id: '154588262109790348' },
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
  { min: 125, max: 149, id: '1545883826121322817' },
  { min: 100, max: 124, id: '1545883001090901665' },
  { min: 80, max: 99, id: '1545881490582167112' },
  { min: 70, max: 79, id: '1545881103158747106' },
  { min: 60, max: 69, id: '1359366160758300738' },
  { min: 50, max: 59, id: '1359366092628280566' },
  { min: 40, max: 49, id: '1359366024806168516' },
  { min: 30, max: 39, id: '1359365955097722112' },
  { min: 20, max: 29, id: '1359365884605064510' },
  { min: 15, max: 19, id: '1359365813416403106' },
  { min: 10, max: 14, id: '1359365706667823104' },
  { min: 5, max: 9, id: '1359365393084448829' },
  { min: 1, max: 4, id: '1359365239384260682' },
  { min: 0, max: 0, id: '1359363942727815260' }
];

const rolesTop3 = [
  '1541902325784912064',
  '1541902188895412405',
  '1541899453521330216'
];

mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI)
  .then(() => console.log('Base de datos conectada al 100 > < :v'))
  .catch(err => console.error('Puchica fallo la base de datos:', err));

client.once('ready', async () => {
  console.log(`Bot prendido como ${client.user.tag}! Zeus ya anda zumbando > < :v`);

  const dataAddXp = {
    name: 'añadir-xp',
    description: 'Añade XP a un maje.',
    options: [
      { name: 'usuario', type: ApplicationCommandOptionType.User, description: 'Usuario a quien darle XP', required: true },
      { name: 'cant', type: ApplicationCommandOptionType.Integer, description: 'Cantidad de XP a sumar', required: true }
    ]
  };

  const dataQuitarXp = {
    name: 'quitar-xp',
    description: 'Quita XP a un maje.',
    options: [
      { name: 'usuario', type: ApplicationCommandOptionType.User, description: 'Usuario a quien quitar XP', required: true },
      { name: 'cant', type: ApplicationCommandOptionType.Integer, description: 'Cantidad de XP a restar', required: true }
    ]
  };

  const dataVerXp = {
    name: 'xp',
    description: 'Muestra tu nivel y XP actual',
    options: [
      { name: 'usuario', type: ApplicationCommandOptionType.User, description: 'Usuario a consultar', required: false }
    ]
  };

  const dataTop = {
    name: 'top',
    description: 'Muestra el Top 10 de majes con más XP'
  };

  const dataComprar = {
    name: 'comprar',
    description: 'Abre la tienda de Zeus para comprar bendiciones temporales'
  };

  try {
    await client.application.commands.create(dataAddXp);
    await client.application.commands.create(dataQuitarXp);
    await client.application.commands.create(dataVerXp);
    await client.application.commands.create(dataTop);
    await client.application.commands.create(dataComprar);
    console.log('Comandos listos compa > < :v');
  } catch (error) {
    console.error('Error con los comandos:', error);
  }

  // REVISIÓN CADA MINUTO PARA QUITAR ROLES EXPIRADOS (24 Horas)
  setInterval(async () => {
    try {
      const ahora = new Date();

      // Revisa expiración de XP x2
      const usuariosX2Expirados = await UserXP.find({ rolX2Hasta: { $lte: ahora } });
      for (const u of usuariosX2Expirados) {
        const guild = client.guilds.cache.get(u.guildId);
        if (guild) {
          const member = await guild.members.fetch(u.userId).catch(() => null);
          if (member && member.roles.cache.has(ROL_XP_X2)) {
            await member.roles.remove(ROL_XP_X2).catch(() => {});
          }
        }
        u.rolX2Hasta = null;
        await u.save();
      }

      // Revisa expiración de Canales Ocultos
      const usuariosOcultosExpirados = await UserXP.find({ rolOcultoHasta: { $lte: ahora } });
      for (const u of usuariosOcultosExpirados) {
        const guild = client.guilds.cache.get(u.guildId);
        if (guild) {
          const member = await guild.members.fetch(u.userId).catch(() => null);
          if (member && member.roles.cache.has(ROL_OCULTO)) {
            await member.roles.remove(ROL_OCULTO).catch(() => {});
          }
        }
        u.rolOcultoHasta = null;
        await u.save();
      }
    } catch (err) {
      console.error('Clavo chequeando expiraciones de roles:', err);
    }
  }, 60000);
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
    console.error('Clavo intentando actualizar el rol del maje:', err);
  }
}

async function actualizarRolesTop(guild) {
  try {
    const topUsers = await UserXP.find({ guildId: guild.id })
      .sort({ level: -1, xp: -1 })
      .limit(3);

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

    if (tipo.startsWith('image/')) xpGanada = 3;
    else if (tipo.startsWith('video/')) xpGanada = 4;
    else if (tipo.startsWith('audio/')) xpGanada = 2;
  } else if (message.content.includes('giphy.com') || message.content.includes('tenor.com')) {
    xpGanada = 2;
  } else if (/<a?:\w+:\d+>/.test(message.content)) {
    xpGanada = 1 + (message.content.match(/<a?:\w+:\d+>/g) || []).length;
  }

  if (message.member) {
    if (message.member.roles.cache.has(ROL_XP_X4)) {
      xpGanada *= 4;
    } else if (message.member.roles.cache.has(ROL_XP_X2)) {
      xpGanada *= 2;
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
        .setColor('#00ffaa')
        .setAuthor({ name: 'Subida de Nivel!', iconURL: message.author.displayAvatarURL() })
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true, size: 512 }))
        .setDescription(`<@${userId}> Has sido ayudado por Zeus, subiste de nivel 🔥`)
        .addFields(
          { name: '⭐ Tu Nuevo nivel es:', value: `**${userXpData.level}**`, inline: true },
          { name: '✨ Esta es tu XP:', value: `**${userXpData.xp}** / ${(userXpData.level + 1) * 100}`, inline: true }
        )
        .setFooter({ text: 'Sistema de XP • Zeus', iconURL: client.user.displayAvatarURL() });

      await message.channel.send({ embeds: [levelEmbed] });
    }

    if (message.member) {
      await checkearRoles(message.member, userXpData.level, message.guild);
    }
  } catch (error) {
    console.error('Clavo con la XP:', error);
  }
});

client.on('interactionCreate', async (interaction) => {
  // 🛒 COMANDO /COMPRAR
  if (interaction.isChatInputCommand() && interaction.commandName === 'comprar') {
    const tiendaEmbed = new EmbedBuilder()
      .setColor('#00ffaa')
      .setTitle('🛒 Tienda de Bendiciones de Zeus')
      .setDescription('Gastá tu XP acumulada para obtener ventajas temporales por 1 día 🔥')
      .addFields(
        {
          name: '1️⃣ Rol XP X2 (⚡ 3,000 XP)',
          value: 'Zeus te bendecirá dándote XP X2 a cambio de una inversión por 1 día.'
        },
        {
          name: '2️⃣ Canales Ocultos (👁️ 5,000 XP)',
          value: 'Zeus te dejará ver **canales ocultos** por 1 día.'
        },
        {
          name: '3️⃣ Caja de Regalo de Zeus (🎁 2,000 XP)',
          value: '¡Probá tu suerte! Abrí una caja misteriosa de Zeus.'
        }
      )
      .setFooter({ text: 'Tienda Oficial • Zeus', iconURL: client.user.displayAvatarURL() });

    const menuSelec = new StringSelectMenuBuilder()
      .setCustomId('tienda_menu')
      .setPlaceholder('Elegí un producto para comprar...')
      .addOptions([
        {
          label: 'Rol XP X2 (3,000 XP)',
          description: 'Duplica tu XP ganada por 1 día',
          value: 'comprar_x2',
          emoji: '⚡'
        },
        {
          label: 'Canales Ocultos (5,000 XP)',
          description: 'Acceso a canales ocultos por 1 día',
          value: 'comprar_ocultos',
          emoji: '👁️'
        },
        {
          label: 'Caja de Regalo (2,000 XP)',
          description: '¡Caja misteriosa de Zeus!',
          value: 'comprar_caja',
          emoji: '🎁'
        }
      ]);

    const fila = new ActionRowBuilder().addComponents(menuSelec);

    await interaction.reply({ embeds: [tiendaEmbed], components: [fila] });
    return;
  }

  // 🛍️ PROCESO DE COMPRA DEL MENÚ DESPLEGABLE
  if (interaction.isStringSelectMenu() && interaction.customId === 'tienda_menu') {
    await interaction.deferReply({ ephemeral: true });

    const opcion = interaction.values[0];
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;

    try {
      let userXpData = await UserXP.findOne({ userId, guildId });
      if (!userXpData) {
        userXpData = new UserXP({ userId, guildId, xp: 0, level: 1 });
      }

      // 🧮 Función rápida para calcular la XP total acumulada desde el Nivel 1
      const obtenerXpTotal = (data) => {
        let total = data.xp;
        for (let i = 1; i < data.level; i++) {
          total += (i + 1) * 100;
        }
        return total;
      };

      // 🧮 Función para reconstruir Nivel y XP sobrante después de gastar
      const recalcularProgreso = (data, nuevaXpTotal) => {
        let lvl = 1;
        let xpRestante = nuevaXpTotal;
        let xpReq = (lvl + 1) * 100;

        while (xpRestante >= xpReq) {
          xpRestante -= xpReq;
          lvl++;
          xpReq = (lvl + 1) * 100;
        }

        data.level = lvl;
        data.xp = xpRestante;
      };

      const duracionUnDia = 24 * 60 * 60 * 1000;
      let xpTotalActual = obtenerXpTotal(userXpData);

      if (opcion === 'comprar_x2') {
        const PRECIO = 3000;
        if (xpTotalActual < PRECIO) {
          await interaction.editReply('Puchica maje, no te alcanza. Tené en cuenta que cuesta 3,000 XP en total.');
          return;
        }

        xpTotalActual -= PRECIO;
        recalcularProgreso(userXpData, xpTotalActual);
        userXpData.rolX2Hasta = new Date(Date.now() + duracionUnDia);
        await userXpData.save();

        const rolObj = interaction.guild.roles.cache.get(ROL_XP_X2);
        if (rolObj) await interaction.member.roles.add(rolObj);

        await interaction.editReply('🔥 **¡Compra exitosa!** Le compraste el Rol XP X2 a Zeus por 1 día.');
      } 
      else if (opcion === 'comprar_ocultos') {
        const PRECIO = 5000;
        if (xpTotalActual < PRECIO) {
          await interaction.editReply('Puchica maje, no te alcanza. Tené en cuenta que cuesta 5,000 XP en total.');
          return;
        }

        xpTotalActual -= PRECIO;
        recalcularProgreso(userXpData, xpTotalActual);
        userXpData.rolOcultoHasta = new Date(Date.now() + duracionUnDia);
        await userXpData.save();

        const rolObj = interaction.guild.roles.cache.get(ROL_OCULTO);
        if (rolObj) await interaction.member.roles.add(rolObj);

        await interaction.editReply('👁️ **¡Compra exitosa!** Le compraste el acceso a Canales Ocultos a Zeus por 1 día.');
      }
      else if (opcion === 'comprar_caja') {
        const PRECIO = 2000;
        if (xpTotalActual < PRECIO) {
          await interaction.editReply('Puchica maje, no te alcanza. Tené en cuenta que la Caja cuesta 2,000 XP acumulada.');
          return;
        }

        // Restamos el precio de la XP Total
        xpTotalActual -= PRECIO;

        // Premio al azar entre 500 y 5,000 XP
        const xpGanadaAzar = Math.floor(Math.random() * (5000 - 500 + 1)) + 500;
        xpTotalActual += xpGanadaAzar;

        // Reconstruimos el nivel y la XP de la BD con el nuevo total
        recalcularProgreso(userXpData, xpTotalActual);
        await userXpData.save();

        await interaction.editReply(`🎁 **¡Abriste la Caja de Regalo de Zeus!**\n\nZeus te ha bendecido con **+${xpGanadaAzar} XP** al azar 🔥\nQuedaste en **Nivel ${userXpData.level}** (${userXpData.xp}/${(userXpData.level + 1) * 100} XP).`);
      }
    } catch (err) {
      console.error('Clavo en la tienda:', err);
      await interaction.editReply('Puchica, algo trono al intentar hacer la compra.');
    }
    return;
  }

  // 🛠️ OTROS COMANDOS (AÑADIR-XP, QUITAR-XP, XP, TOP)
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'añadir-xp') {
    await interaction.deferReply();
    const targetUser = interaction.options.getUser('usuario');
    const cantidad = interaction.options.getInteger('cant');
    const guildId = interaction.guild.id;
    const userId = targetUser.id;

    try {
      let userXpData = await UserXP.findOne({ userId, guildId });
      if (!userXpData) userXpData = new UserXP({ userId, guildId, xp: 0, level: 1 });

      userXpData.xp += cantidad;
      while (userXpData.xp >= (userXpData.level + 1) * 100) {
        userXpData.xp -= (userXpData.level + 1) * 100;
        userXpData.level += 1;
      }

      await userXpData.save();
      await actualizarRolesTop(interaction.guild);

      const adminEmbed = new EmbedBuilder()
        .setColor('#ffd700')
        .setAuthor({ name: 'XP Puesta por Admin', iconURL: targetUser.displayAvatarURL() })
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 512 }))
        .setDescription(`<@${userId}> Has sido ayudado por Zeus, se te sumo XP.`)
        .addFields(
          { name: '⭐ Tu Nuevo nivel es:', value: `**${userXpData.level}**`, inline: true },
          { name: '✨ Esta es tu XP:', value: `**${userXpData.xp}** / ${(userXpData.level + 1) * 100}`, inline: true }
        )
        .setFooter({ text: 'Panel de Administración • Zeus', iconURL: client.user.displayAvatarURL() });

      await interaction.editReply({ embeds: [adminEmbed] });
      const member = interaction.guild.members.cache.get(userId);
      if (member) await checkearRoles(member, userXpData.level, interaction.guild);
    } catch (error) {
      console.error('Clavo en añadir-xp:', error);
      await interaction.editReply('Puchica algo trono feo con la base de datos.');
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
        await interaction.editReply('Puchica, ese maje ni siquiera tiene registro.');
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
        .setAuthor({ name: 'XP Quitada por Admin', iconURL: targetUser.displayAvatarURL() })
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 512 }))
        .setDescription(`<@${userId}> Zeus te ha castigado, se te resto XP.`)
        .addFields(
          { name: '⭐ Tu Nivel actual es:', value: `**${userXpData.level}**`, inline: true },
          { name: '✨ Esta es tu XP:', value: `**${userXpData.xp}** / ${(userXpData.level + 1) * 100}`, inline: true }
        )
        .setFooter({ text: 'Panel de Administración • Zeus', iconURL: client.user.displayAvatarURL() });

      await interaction.editReply({ embeds: [adminEmbed] });
      const member = interaction.guild.members.cache.get(userId);
      if (member) await checkearRoles(member, userXpData.level, interaction.guild);
    } catch (error) {
      console.error('Clavo en quitar-xp:', error);
      await interaction.editReply('Puchica algo trono feo con la base de datos.');
    }
  }

  if (interaction.commandName === 'xp') {
    await interaction.deferReply();
    const targetUser = interaction.options.getUser('usuario') || interaction.user;
    const guildId = interaction.guild.id;
    const userId = targetUser.id;

    try {
      let userXpData = await UserXP.findOne({ userId, guildId });
      if (!userXpData) userXpData = { xp: 0, level: 1 };

      const xpNecesaria = (userXpData.level + 1) * 100;

      const xpEmbed = new EmbedBuilder()
        .setColor('#3b82f6')
        .setAuthor({ name: `Nivel y XP de ${targetUser.username}`, iconURL: targetUser.displayAvatarURL() })
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 512 }))
        .setDescription('Consulta de experiencia en el servidor 🔥')
        .addFields(
          { name: '⭐ Nivel actual:', value: `**${userXpData.level}**`, inline: true },
          { name: '✨ Puntos de XP:', value: `**${userXpData.xp}** / ${xpNecesaria}`, inline: true }
        )
        .setFooter({ text: 'Consulta de XP • Zeus', iconURL: client.user.displayAvatarURL() });

      await interaction.editReply({ embeds: [xpEmbed] });
    } catch (error) {
      console.error('Clavo consultando la XP:', error);
      await interaction.editReply('Puchica algo trono feo al intentar ver tu XP.');
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
        await interaction.editReply('Aún no hay nadie registrado en la tabla de XP.');
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
        .setColor('#ffd700')
        .setTitle('🏆 Leaderboard - Top 10 del Servidor')
        .setThumbnail(interaction.guild.iconURL({ dynamic: true }) || client.user.displayAvatarURL())
        .setDescription(descripcionTop)
        .setFooter({ text: 'Tabla de Clasificación • Zeus', iconURL: client.user.displayAvatarURL() });

      await interaction.editReply({ embeds: [topEmbed] });
    } catch (error) {
      console.error('Clavo en el comando top:', error);
      await interaction.editReply('Puchica algo trono feo al sacar el top.');
    }
  }
});

client.login(process.env.TOKEN || process.env.DISCORD_TOKEN);

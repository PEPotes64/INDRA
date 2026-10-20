process.on('unhandledRejection', error => {
    console.error('❌ ERROR NO CONTROLADO ALV:', error);
});
process.on('uncaughtException', error => {
    console.error('❌ EXCEPCIÓN CRÍTICA:', error);
});

const http = require('http');
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Zeus ta vivo y al centavo maje! > :v');
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

// TU ID EXCLUSIVA Y ROLES
const PEPO_ID = '1259006426978713620';
const ROL_XP_X4 = '123456789012345678';
const ROL_XP_X2 = '1545950431908470865';
const ROL_OCULTO = '1545963099788410950';

const nivelesRoles = [
    { min: 1000, max: 99999, id: '1545889068961863680' },
    { min: 850, max: 999, id: '1545888858426703932' },
    { min: 800, max: 849, id: '1545888736145683201' },
    { min: 750, max: 799, id: '1545884446151663635' },
    { min: 700, max: 749, id: '154588626210970348' },
    { min: 650, max: 699, id: '154588769677654770' },
    { min: 600, max: 649, id: '154588685827D654770' },
    { min: 550, max: 599, id: '154588642571805086' },
    { min: 500, max: 549, id: '154588629998518194' },
    { min: 450, max: 499, id: '1545886123756669038' },
    { min: 400, max: 449, id: '1545885802170905539' },
    { min: 350, max: 399, id: '1545885424424059043' },
    { min: 300, max: 349, id: '154588259556207884' },
    { min: 250, max: 299, id: '1545884764438011985' },
    { min: 200, max: 249, id: '1545884525395976263' },
    { min: 150, max: 199, id: '154588426132228217' },
    { min: 125, max: 149, id: '1545883826121322817' },
    { min: 100, max: 124, id: '154588300109001665' },
    { min: 80, max: 99, id: '1545881490582167112' },
    { min: 70, max: 79, id: '1545881103158747106' },
    { min: 60, max: 69, id: '1359366160758300738' },
    { min: 50, max: 59, id: '135936609626280566' },
    { min: 40, max: 49, id: '1359356024806168516' },
    { min: 30, max: 39, id: '135936595509722112' },
    { min: 20, max: 29, id: '1359365884605064510' },
    { min: 15, max: 19, id: '1359365813416403105' },
    { min: 10, max: 14, id: '1359365706667823104' },
    { min: 5, max: 9, id: '135936530310644820' },
    { min: 1, max: 4, id: '135936523938260682' },
    { min: 0, max: 0, id: '1359363942727815260' }
];

mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI)
    .then(() => console.log('Base de datos conectada al 100 > :v'))
    .catch(err => console.error('Puchica fallo la base de datos:', err));

// --- DEFINICIÓN DE COMANDOS SLASH ---
const dataAddXp = {
    name: 'añadir-xp',
    description: 'Añade XP a un maje.',
    options: [
        { name: 'usuario', type: ApplicationCommandOptionType.User, description: 'Usuario', required: true },
        { name: 'cant', type: ApplicationCommandOptionType.Integer, description: 'Cantidad de XP', required: true }
    ]
};

const dataQuitarXp = {
    name: 'quitar-xp',
    description: 'Quita XP a un maje.',
    options: [
        { name: 'usuario', type: ApplicationCommandOptionType.User, description: 'Usuario', required: true },
        { name: 'cant', type: ApplicationCommandOptionType.Integer, description: 'Cantidad de XP', required: true }
    ]
};

const dataVerXp = {
    name: 'xp',
    description: 'Muestra tu nivel y XP actual.',
    options: [
        { name: 'usuario', type: ApplicationCommandOptionType.User, description: 'Usuario opcional', required: false }
    ]
};

const dataTop = { name: 'top', description: 'Muestra el Top 10 de majes con más XP' };
const dataComprar = { name: 'comprar', description: 'Abre la tienda de Zeus para comprar bendiciones temporales' };

client.once('ready', async () => {
    console.log(`Bot prendido como ${client.user.tag}! Zeus ya anda zumbando > :v`);

    try {
        const comandosTotales = [dataAddXp, dataQuitarXp, dataVerXp, dataTop, dataComprar];

        for (const [guildId, guild] of client.guilds.cache) {
            await guild.commands.set(comandosTotales);
            console.log(`✅ Comandos cargados en el servidor: ${guild.name} (${guildId})`);
        }
        console.log('¡Comandos listos al 100 alv > :v!');
    } catch (error) {
        console.error('❌ Error cargando comandos:', error);
    }
});

// --- HELPERS ---
const obtenerXpTotal = (data) => {
    let total = data.xp;
    for (let i = 1; i < data.level; i++) {
        total += (i + 1) * 100;
    }
    return total;
};

const recalcularProgreso = (data, nuevoXpTotal) => {
    let lvl = 1;
    let xpRestante = nuevoXpTotal;
    let xpReq = (lvl + 1) * 100;

    while (xpRestante >= xpReq) {
        xpRestante -= xpReq;
        lvl++;
        xpReq = (lvl + 1) * 100;
    }

    data.level = lvl;
    data.xp = xpRestante;
};

const DOS_DIAS_MS = 2 * 24 * 60 * 60 * 1000;
const verificarCooldown = (ultimaFecha) => {
    if (!ultimaFecha) return null;
    const ahora = Date.now();
    const tiempoPasado = ahora - new Date(ultimaFecha).getTime();
    if (tiempoPasado < DOS_DIAS_MS) {
        const restanteMs = DOS_DIAS_MS - tiempoPasado;
        const h = Math.floor(restanteMs / (1000 * 60 * 60));
        const m = Math.floor((restanteMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${h}h y${m}m`;
    }
    return null;
};

// --- CHEQUEO DE ROLES ---
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

// --- SISTEMA DE XP BALANCEADO ---
client.on('messageCreate', async message => {
    if (message.author.bot || !message.guild) return;

    const userId = message.author.id;
    const guildId = message.guild.id;

    let xpGanada = Math.floor(Math.random() * 11) + 15;

    if (message.attachments.size > 0) {
        const attachment = message.attachments.first();
        const tipo = attachment.contentType || '';
        if (tipo.startsWith('image/')) xpGanada += 25;
        else if (tipo.startsWith('video/')) xpGanada += 35;
        else if (tipo.startsWith('audio/')) xpGanada += 20;
    } else if (message.content.includes('giphy.com') || message.content.includes('tenor.com')) {
        xpGanada += 10;
    } else if (/<a?:[\w]+:\d+>/.test(message.content)) {
        xpGanada += (message.content.match(/<a?:[\w]+:\d+>/g) || []).length * 5;
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

        if (subioNivel) {
            const levelEmbed = new EmbedBuilder()
                .setColor('#00ffaa')
                .setAuthor({ name: '¡Subida de Nivel!', iconURL: message.author.displayAvatarURL() })
                .setThumbnail(message.author.displayAvatarURL({ dynamic: true, size: 512 }))
                .setDescription(`<@${userId}> Has sido ayudado por Zeus, subiste de nivel 🔥`)
                .addFields(
                    { name: '⭐ Tu Nuevo nivel es:', value: `**${userXpData.level}**`, inline: true },
                    { name: '✨ Esta es tu XP:', value: `**${userXpData.xp} /${(userXpData.level + 1) * 100}**`, inline: true }
                )
                .setFooter({ text: 'Sistema de XP • Zeus', iconURL: client.user.displayAvatarURL() });

            await message.channel.send({ embeds: [levelEmbed] });
        }

        if (message.member) {
            await checkearRoles(message.member, userXpData.level, message.guild);
        }
    } catch (error) {
        console.error("Clavo con la XP:", error);
    }
});

// --- MANEJADOR DE COMANDOS SLASH ---
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'xp') {
        try {
            await interaction.deferReply();
            const target = interaction.options.getUser('usuario') || interaction.user;
            let userXp = await UserXP.findOne({ userId: target.id, guildId: interaction.guild.id });

            const xp = userXp ? userXp.xp : 0;
            const level = userXp ? userXp.level : 1;
            const xpSiguiente = (level + 1) * 100;

            const embedXp = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle(`⭐ Nivel y XP de ${target.username}`)
                .setDescription('Consulta el progreso actual en el servidor.')
                .addFields(
                    { name: '⭐ Nivel Actual:', value: `**${level}**`, inline: true },
                    { name: '✨ XP Acumulada:', value: `**${xp} /${xpSiguiente}**`, inline: true }
                )
                .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: 'Zeus XP System', iconURL: client.user.displayAvatarURL() });

            return await interaction.editReply({ embeds: [embedXp] });
        } catch (err) {
            console.error("Error en /xp:", err);
            if (interaction.deferred) return await interaction.editReply(`❌ Error al cargar XP: \`${err.message}\``);
        }
    }

    if (commandName === 'top') {
        try {
            await interaction.deferReply();
            const topUsers = await UserXP.find({ guildId: interaction.guild.id }).sort({ level: -1, xp: -1 }).limit(10);

            if (!topUsers || topUsers.length === 0) {
                return await interaction.editReply('❌ No hay registros de XP todavía en este servidor.');
            }

            let desc = topUsers.map((u, i) => {
                const medalla = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `**#${i + 1}**`;
                return `${medalla} <@${u.userId}> — **Nivel ${u.level}** (${u.xp} XP)`;
            }).join('\n');

            const embedTop = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle('🏆 TOP 10 MAJES CON MÁS XP Y NIVELES')
                .setDescription(desc)
                .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
                .setFooter({ text: 'Ranking Oficial • Zeus', iconURL: client.user.displayAvatarURL() });

            return await interaction.editReply({ embeds: [embedTop] });
        } catch (err) {
            console.error("Error en /top:", err);
            if (interaction.deferred) return await interaction.editReply(`❌ Error al cargar el top: \`${err.message}\``);
        }
    }

    if (commandName === 'añadir-xp') {
        try {
            if (interaction.user.id !== PEPO_ID) {
                return await interaction.reply({ content: '❌ Solo Pepo.', ephemeral: true });
            }
            await interaction.deferReply();

            const target = interaction.options.getUser('usuario');
            const cant = interaction.options.getInteger('cant');

            let userXp = await UserXP.findOne({ userId: target.id, guildId: interaction.guild.id });
            if (!userXp) userXp = new UserXP({ userId: target.id, guildId: interaction.guild.id, xp: 0, level: 1 });

            userXp.xp += cant;
            let xpNecesaria = (userXp.level + 1) * 100;
            while (userXp.xp >= xpNecesaria) {
                userXp.xp -= xpNecesaria;
                userXp.level += 1;
                xpNecesaria = (userXp.level + 1) * 100;
            }

            await userXp.save();

            const embedAdd = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle('👑 XP Puesta por Admin')
                .setDescription(`<@${target.id}> Has sido ayudado por Zeus, se te sumaron **+${cant} XP**`)
                .addFields(
                    { name: '⭐ Tu Nuevo nivel es:', value: `**${userXp.level}**`, inline: false },
                    { name: '✨ Esta es tu XP:', value: `**${userXp.xp} /${(userXp.level + 1) * 100}**`, inline: false }
                )
                .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: 'Panel de Administración • Zeus', iconURL: client.user.displayAvatarURL() });

            return await interaction.editReply({ embeds: [embedAdd] });
        } catch (err) {
            console.error("Error en añadir-xp:", err);
            if (interaction.deferred) return await interaction.editReply(`❌ Error: \`${err.message}\``);
        }
    }

    if (commandName === 'quitar-xp') {
        try {
            if (interaction.user.id !== PEPO_ID) {
                return await interaction.reply({ content: '❌ Solo Pepo.', ephemeral: true });
            }
            await interaction.deferReply();

            const target = interaction.options.getUser('usuario');
            const cant = interaction.options.getInteger('cant');

            let userXp = await UserXP.findOne({ userId: target.id, guildId: interaction.guild.id });
            if (!userXp) return await interaction.editReply('❌ El usuario no tiene registros.');

            userXp.xp = Math.max(0, userXp.xp - cant);
            await userXp.save();

            const embedQuitar = new EmbedBuilder()
                .setColor('#FF3333')
                .setTitle('⚠️ XP Restada por Admin')
                .setDescription(`A <@${target.id}> se le castigó y se le quitaron **-${cant} XP**`)
                .addFields(
                    { name: '⭐ Nivel Actual:', value: `**${userXp.level}**`, inline: false },
                    { name: '✨ XP Restante:', value: `**${userXp.xp} /${(userXp.level + 1) * 100}**`, inline: false }
                )
                .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: 'Panel de Administración • Zeus', iconURL: client.user.displayAvatarURL() });

            return await interaction.editReply({ embeds: [embedQuitar] });
        } catch (err) {
            console.error("Error en quitar-xp:", err);
            if (interaction.deferred) return await interaction.editReply(`❌ Error: \`${err.message}\``);
        }
    }

    if (commandName === 'comprar') {
        await interaction.deferReply({ ephemeral: true });

        const tiendaEmbed = new EmbedBuilder()
            .setColor('#00ffaa')
            .setTitle('⚡ Tienda de Bendiciones de Zeus')
            .setDescription('Gasta tu XP acumulada para obtener bendiciones temporales.')
            .addFields(
                { name: '⚡ Rol XP X2 (3,000 XP)', value: 'Duplica tu XP ganada por 1 día.' },
                { name: '👁️ Canales Ocultos (5,000 XP)', value: 'Acceso a canales ocultos por 1 día.' },
                { name: '🎁 Caja de Regalo de Zeus (2,000 XP)', value: '¡Probá tu suerte! Caja misteriosa de Zeus.' }
            );

        const opcionesMenu = [
            { label: 'Rol XP X2 (3,000 XP)', description: 'Duplica tu XP ganada por 1 día', value: 'comprar_x2', emoji: '⚡' },
            { label: 'Canales Ocultos (5,000 XP)', description: 'Acceso a canales ocultos por 1 día', value: 'comprar_ocultos', emoji: '👁️' },
            { label: 'Caja de Regalo (2,000 XP)', description: 'Caja misteriosa de Zeus', value: 'comprar_caja', emoji: '🎁' }
        ];

        const menuSelec = new StringSelectMenuBuilder()
            .setCustomId('tienda_menu')
            .setPlaceholder('Elegí una bendición para comprar...')
            .addOptions(opcionesMenu);

        const fila = new ActionRowBuilder().addComponents(menuSelec);
        return await interaction.editReply({ embeds: [tiendaEmbed], components: [fila] });
    }
});

// --- MANEJADOR DE SELECCIONES EN LA TIENDA ---
client.on('interactionCreate', async interaction => {
    if (!interaction.isStringSelectMenu()) return;

    const { customId, values } = interaction;

    try {
        if (customId === 'tienda_menu') {
            await interaction.deferReply({ ephemeral: true });
            const opcion = values[0];
            const userId = interaction.user.id;
            const guildId = interaction.guild.id;

            let userXpData = await UserXP.findOne({ userId, guildId });
            if (!userXpData) userXpData = new UserXP({ userId, guildId, xp: 0, level: 1 });

            const ahora = Date.now();
            const xpTotalActual = obtenerXpTotal(userXpData);

            if (opcion === 'comprar_x2') {
                const cooldownMsg = verificarCooldown(userXpData.ultimoUsoX2);
                if (cooldownMsg) {
                    return await interaction.editReply(`⌛ **¡Aguantá el coche, maje!** Ya compraste el Rol XP X2 hace poco. Tenés que esperar **${cooldownMsg}**.`);
                }

                const PRECIO = 3000;
                if (xpTotalActual < PRECIO) {
                    return await interaction.editReply(`❌ Puchica maje, no te alcanza. Tené en cuenta que cuesta 3,000 XP acumulada.`);
                }

                const nuevoTotal = xpTotalActual - PRECIO;
                recalcularProgreso(userXpData, nuevoTotal);
                userXpData.rolX2Hasta = new Date(ahora + (24 * 60 * 60 * 1000));
                userXpData.ultimoUsoX2 = new Date(ahora);
                await userXpData.save();

                const member = await interaction.guild.members.fetch(userId);
                if (member) await member.roles.add(ROL_XP_X2);

                return await interaction.editReply(`🔥 **¡Compra exitosa!** Le compraste el Rol XP X2 a Zeus por 1 día.`);
            }

            if (opcion === 'comprar_ocultos') {
                const cooldownMsg = verificarCooldown(userXpData.ultimoUsoOculto);
                if (cooldownMsg) {
                    return await interaction.editReply(`⌛ **¡Aguantá el coche, maje!** Ya compraste Canales Ocultos hace poco. Tenés que esperar **${cooldownMsg}**.`);
                }

                const PRECIO = 5000;
                if (xpTotalActual < PRECIO) {
                    return await interaction.editReply(`❌ Puchica maje, no te alcanza. Cuesta 5,000 XP acumulada.`);
                }

                const nuevoTotal = xpTotalActual - PRECIO;
                recalcularProgreso(userXpData, nuevoTotal);
                userXpData.rolOcultoHasta = new Date(ahora + (24 * 60 * 60 * 1000));
                userXpData.ultimoUsoOculto = new Date(ahora);
                await userXpData.save();

                const member = await interaction.guild.members.fetch(userId);
                if (member) await member.roles.add(ROL_OCULTO);

                return await interaction.editReply(`👁️ **¡Compra exitosa!** Le compraste acceso a Canales Ocultos a Zeus por 1 día.`);
            }

            if (opcion === 'comprar_caja') {
                const cooldownMsg = verificarCooldown(userXpData.ultimoUsoCaja);
                if (cooldownMsg) {
                    return await interaction.editReply(`⌛ **¡Aguantá el coche, maje!** Ya compraste tu Caja de Regalo. Tenés que esperar **${cooldownMsg}**.`);
                }

                const PRECIO = 2000;
                if (xpTotalActual < PRECIO) {
                    return await interaction.editReply(`❌ Puchica maje, no te alcanza. Cuesta 2,000 XP acumulada.`);
                }

                let nuevoTotal = xpTotalActual - PRECIO;
                const xpGanadaAzar = Math.floor(Math.random() * (5000 - 500 + 1)) + 500;
                nuevoTotal += xpGanadaAzar;

                recalcularProgreso(userXpData, nuevoTotal);
                userXpData.ultimoUsoCaja = new Date(ahora);
                await userXpData.save();

                return await interaction.editReply(`🎁 **¡Abriste la Caja de Regalo de Zeus!**\n\nZeus te ha bendecido con **+${xpGanadaAzar} XP** al azar 🔥\nQuedaste en **Nivel ${userXpData.level}** (${userXpData.xp} / ${(userXpData.level + 1) * 100} XP).`);
            }
        }
    } catch (err) {
        console.error("Error en menú de tienda:", err);
    }
});

console.log('🔄 Intentando conectar el bot a Discord...');
client.login(process.env.DISCORD_TOKEN)
    .then(() => console.log('✅ ¡Login exitoso en Discord!'))
    .catch(err => console.error('❌ ERROR CRÍTICO EN LOGIN ALV:', err));

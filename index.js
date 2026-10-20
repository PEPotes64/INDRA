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

const UserXP = require('./UserXP.js');[span_2](start_span)[span_2](end_span)

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

mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI)[span_3](start_span)[span_3](end_span)
    .then(() => console.log('Base de datos conectada al 100 > :v'))[span_4](start_span)[span_4](end_span)
    .catch(err => console.error('Puchica fallo la base de datos:', err));[span_5](start_span)[span_5](end_span)

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

// --- SISTEMA DE XP BALANCEADO ( MÁS RÁPIDO ) ---
client.on('messageCreate', async message => {
    if (message.author.bot || !message.guild) return;

    const userId = message.author.id;
    const guildId = message.guild.id;

    // AHORA DA ENTRE 15 Y 25 XP POR MENSAJE NORMAL
    let xpGanada = Math.floor(Math.random() * 11) + 15;

    if (message.attachments.size > 0) {
        const attachment = message.attachments.first();
        const tipo = attachment.contentType || '';
        if (tipo.startsWith('image/')) xpGanada += 25; // Fotos dan más amor
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
        let userXpData = await UserXP.findOne({ userId, guildId });[span_6](start_span)[span_6](end_span)
        if (!userXpData) {
            userXpData = new UserXP({ userId, guildId, xp: 0, level: 1 });[span_7](start_span)[span_7](end_span)
        }

        userXpData.xp += xpGanada;
        let xpNecesaria = (userXpData.level + 1) * 100;[span_8](start_span)[span_8](end_span)
        let subioNivel = false;

        while (userXpData.xp >= xpNecesaria) {
            userXpData.xp -= xpNecesaria;
            userXpData.level += 1;
            xpNecesaria = (userXpData.level + 1) * 100;[span_9](start_span)[span_9](end_span)
            subioNivel = true;
        }

        await userXpData.save();[span_10](start_span)[span_10](end_span)

        if (subioNivel) {
            const levelEmbed = new EmbedBuilder()
                .setColor('#00ffaa')
                .setAuthor({ name: '¡Subida de Nivel!', iconURL: message.author.displayAvatarURL() })
                .setThumbnail(message.author.displayAvatarURL({ dynamic: true, size: 512 }))
                .setDescription(`<@${userId}> Has sido ayudado por Zeus, subiste de nivel 🔥`)[span_11](start_span)[span_11](end_span)
                .addFields(
                    { name: '⭐ Tu Nuevo nivel es:', value: `**${userXpData.level}**`, inline: true },[span_12](start_span)[span_12](end_span)
                    { name: '✨ Esta es tu XP:', value: `**${userXpData.xp} /${(userXpData.level + 1) * 100}**`, inline: true }[span_13](start_span)[span_13](end_span)
                )
                .setFooter({ text: 'Sistema de XP • Zeus', iconURL: client.user.displayAvatarURL() });[span_14](start_span)[span_14](end_span)

            await message.channel.send({ embeds: [levelEmbed] });[span_15](start_span)[span_15](end_span)
        }

        if (message.member) {
            await checkearRoles(message.member, userXpData.level, message.guild);[span_16](start_span)[span_16](end_span)
        }
    } catch (error) {
        console.error("Clavo con la XP:", error);[span_17](start_span)[span_17](end_span)
    }
});

// --- MANEJADOR DE COMANDOS SLASH ---
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'xp') {
        try {
            await interaction.deferReply();
            const target = interaction.options.getUser('usuario') || interaction.user;[span_18](start_span)[span_18](end_span)
            let userXp = await UserXP.findOne({ userId: target.id, guildId: interaction.guild.id });[span_19](start_span)[span_19](end_span)

            const xp = userXp ? userXp.xp : 0;[span_20](start_span)[span_20](end_span)
            const level = userXp ? userXp.level : 1;[span_21](start_span)[span_21](end_span)
            const xpSiguiente = (level + 1) * 100;[span_22](start_span)[span_22](end_span)

            const embedXp = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle(`⭐ Nivel y XP de ${target.username}`)
                .setDescription('Consulta el progreso actual en el servidor.')[span_23](start_span)[span_23](end_span)
                .addFields(
                    { name: '⭐ Nivel Actual:', value: `**${level}**`, inline: true },[span_24](start_span)[span_24](end_span)
                    { name: '✨ XP Acumulada:', value: `**${xp} /${xpSiguiente}**`, inline: true }[span_25](start_span)[span_25](end_span)
                )
                .setThumbnail(target.displayAvatarURL({ dynamic: true }))[span_26](start_span)[span_26](end_span)
                .setFooter({ text: 'Zeus XP System', iconURL: client.user.displayAvatarURL() });[span_27](start_span)[span_27](end_span)

            return await interaction.editReply({ embeds: [embedXp] });[span_28](start_span)[span_28](end_span)
        } catch (err) {
            console.error("Error en /xp:", err);[span_29](start_span)[span_29](end_span)
            if (interaction.deferred) return await interaction.editReply(`❌ Error al cargar XP: \`${err.message}\``);[span_30](start_span)[span_30](end_span)
        }
    }

    if (commandName === 'top') {
        try {
            await interaction.deferReply();
            const topUsers = await UserXP.find({ guildId: interaction.guild.id }).sort({ level: -1, xp: -1 }).limit(10);[span_31](start_span)[span_31](end_span)

            if (!topUsers || topUsers.length === 0) {
                return await interaction.editReply('❌ No hay registros de XP todavía en este servidor.');[span_32](start_span)[span_32](end_span)
            }

            let desc = topUsers.map((u, i) => {
                const medalla = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `**#${i + 1}**`;[span_33](start_span)[span_33](end_span)
                return `${medalla} <@${u.userId}> — **Nivel ${u.level}** (${u.xp} XP)`;[span_34](start_span)[span_34](end_span)
            }).join('\n');[span_35](start_span)[span_35](end_span)

            const embedTop = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle('🏆 TOP 10 MAJES CON MÁS XP Y NIVELES')[span_36](start_span)[span_36](end_span)
                .setDescription(desc)[span_37](start_span)[span_37](end_span)
                .setThumbnail(interaction.guild.iconURL({ dynamic: true }))[span_38](start_span)[span_38](end_span)
                .setFooter({ text: 'Ranking Oficial • Zeus', iconURL: client.user.displayAvatarURL() });[span_39](start_span)[span_39](end_span)

            return await interaction.editReply({ embeds: [embedTop] });[span_40](start_span)[span_40](end_span)
        } catch (err) {
            console.error("Error en /top:", err);[span_41](start_span)[span_41](end_span)
            if (interaction.deferred) return await interaction.editReply(`❌ Error al cargar el top: \`${err.message}\``);[span_42](start_span)[span_42](end_span)
        }
    }

    if (commandName === 'añadir-xp') {
        try {
            if (interaction.user.id !== PEPO_ID) {
                return await interaction.reply({ content: '❌ Solo Pepo.', ephemeral: true });[span_43](start_span)[span_43](end_span)
            }
            await interaction.deferReply();

            const target = interaction.options.getUser('usuario');[span_44](start_span)[span_44](end_span)
            const cant = interaction.options.getInteger('cant');[span_45](start_span)[span_45](end_span)

            let userXp = await UserXP.findOne({ userId: target.id, guildId: interaction.guild.id });[span_46](start_span)[span_46](end_span)
            if (!userXp) userXp = new UserXP({ userId: target.id, guildId: interaction.guild.id, xp: 0, level: 1 });[span_47](start_span)[span_47](end_span)

            userXp.xp += cant;[span_48](start_span)[span_48](end_span)
            let xpNecesaria = (userXp.level + 1) * 100;[span_49](start_span)[span_49](end_span)
            while (userXp.xp >= xpNecesaria) {
                userXp.xp -= xpNecesaria;[span_50](start_span)[span_50](end_span)
                userXp.level += 1;[span_51](start_span)[span_51](end_span)
                xpNecesaria = (userXp.level + 1) * 100;[span_52](start_span)[span_52](end_span)
            }

            await userXp.save();[span_53](start_span)[span_53](end_span)

            const embedAdd = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle('👑 XP Puesta por Admin')[span_54](start_span)[span_54](end_span)
                .setDescription(`<@${target.id}> Has sido ayudado por Zeus, se te sumaron **+${cant} XP**`)[span_55](start_span)[span_55](end_span)
                .addFields(
                    { name: '⭐ Tu Nuevo nivel es:', value: `**${userXp.level}**`, inline: false },[span_56](start_span)[span_56](end_span)
                    { name: '✨ Esta es tu XP:', value: `**${userXp.xp} /${(userXp.level + 1) * 100}**`, inline: false }[span_57](start_span)[span_57](end_span)
                )
                .setThumbnail(target.displayAvatarURL({ dynamic: true }))[span_58](start_span)[span_58](end_span)
                .setFooter({ text: 'Panel de Administración • Zeus', iconURL: client.user.displayAvatarURL() });[span_59](start_span)[span_59](end_span)

            return await interaction.editReply({ embeds: [embedAdd] });[span_60](start_span)[span_60](end_span)
        } catch (err) {
            console.error("Error en añadir-xp:", err);[span_61](start_span)[span_61](end_span)
            if (interaction.deferred) return await interaction.editReply(`❌ Error: \`${err.message}\``);[span_62](start_span)[span_62](end_span)
        }
    }

    if (commandName === 'quitar-xp') {
        try {
            if (interaction.user.id !== PEPO_ID) {
                return await interaction.reply({ content: '❌ Solo Pepo.', ephemeral: true });[span_63](start_span)[span_63](end_span)
            }
            await interaction.deferReply();

            const target = interaction.options.getUser('usuario');[span_64](start_span)[span_64](end_span)
            const cant = interaction.options.getInteger('cant');[span_65](start_span)[span_65](end_span)

            let userXp = await UserXP.findOne({ userId: target.id, guildId: interaction.guild.id });[span_66](start_span)[span_66](end_span)
            if (!userXp) return await interaction.editReply('❌ El usuario no tiene registros.');[span_67](start_span)[span_67](end_span)

            userXp.xp = Math.max(0, userXp.xp - cant);[span_68](start_span)[span_68](end_span)
            await userXp.save();[span_69](start_span)[span_69](end_span)

            const embedQuitar = new EmbedBuilder()
                .setColor('#FF3333')
                .setTitle('⚠️ XP Restada por Admin')[span_70](start_span)[span_70](end_span)
                .setDescription(`A <@${target.id}> se le castigó y se le quitaron **-${cant} XP**`)[span_71](start_span)[span_71](end_span)
                .addFields(
                    { name: '⭐ Nivel Actual:', value: `**${userXp.level}**`, inline: false },[span_72](start_span)[span_72](end_span)
                    { name: '✨ XP Restante:', value: `**${userXp.xp} /${(userXp.level + 1) * 100}**`, inline: false }[span_73](start_span)[span_73](end_span)
                )
                .setThumbnail(target.displayAvatarURL({ dynamic: true }))[span_74](start_span)[span_74](end_span)
                .setFooter({ text: 'Panel de Administración • Zeus', iconURL: client.user.displayAvatarURL() });[span_75](start_span)[span_75](end_span)

            return await interaction.editReply({ embeds: [embedQuitar] });[span_76](start_span)[span_76](end_span)
        } catch (err) {
            console.error("Error en quitar-xp:", err);[span_77](start_span)[span_77](end_span)
            if (interaction.deferred) return await interaction.editReply(`❌ Error: \`${err.message}\``);[span_78](start_span)[span_78](end_span)
        }
    }

    if (commandName === 'comprar') {
        await interaction.deferReply({ ephemeral: true });

        const tiendaEmbed = new EmbedBuilder()
            .setColor('#00ffaa')
            .setTitle('⚡ Tienda de Bendiciones de Zeus')[span_79](start_span)[span_79](end_span)
            .setDescription('Gasta tu XP acumulada para obtener bendiciones temporales.')[span_80](start_span)[span_80](end_span)
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

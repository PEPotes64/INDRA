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
    ActionRowBuilder,
    AttachmentBuilder
} = require('discord.js');
const mongoose = require('mongoose');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const path = require('path');
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

// TU ID EXCLUSIVA PARA /CRITICA Y /SETBG
const PEPO_ID = '1259006426978713620';

// 🛡️ IDs de los roles de multiplicadores y tienda[span_17](start_span)[span_17](end_span)
const ROL_XP_X4 = '123456789012345678'; // ID de tu rol x4[span_18](start_span)[span_18](end_span)
const ROL_XP_X2 = '1545950431908470865'; // Rol x2 de XP[span_19](start_span)[span_19](end_span)
const ROL_OCULTO = '1545963099788410950'; // Rol de canales ocultos[span_20](start_span)[span_20](end_span)

const nivelesRoles = [
    { min: 1000, max: 99999, id: '154588906863863480' },
    { min: 850, max: 999, id: '1545888858426703932' },
    { min: 800, max: 849, id: '1545888736145683201' },
    { min: 750, max: 799, id: '1545884446151663635' },
    { min: 700, max: 749, id: '15458826210970348' },
    { min: 650, max: 699, id: '154588769677657916' },
    { min: 600, max: 649, id: '154588658270654770' },
    { min: 550, max: 599, id: '154588642571805085' },
    { min: 500, max: 549, id: '154588629998518194' },
    { min: 450, max: 499, id: '154588612375666938' },
    { min: 400, max: 449, id: '154588580179985539' },
    { min: 350, max: 399, id: '154588424424059043' },
    { min: 300, max: 349, id: '1545882595554207884' },
    { min: 250, max: 299, id: '1545884764438011985' },
    { min: 200, max: 249, id: '1545884525395976263' },
    { min: 150, max: 199, id: '1545884262132228217' },
    { min: 125, max: 149, id: '1545883826121322817' },
    { min: 100, max: 124, id: '1545883001090901665' },
    { min: 80, max: 99, id: '1545881490582167112' },
    { min: 70, max: 79, id: '1545881103158747106' },
    { min: 60, max: 69, id: '1359366160758300738' },
    { min: 50, max: 59, id: '135936609626280566' },
    { min: 40, max: 49, id: '1359366024806168516' },
    { min: 30, max: 39, id: '135936595509722112' },
    { min: 20, max: 29, id: '1359365884605064510' },
    { min: 15, max: 19, id: '1359365813416403106' },
    { min: 10, max: 14, id: '1359365706667823104' },
    { min: 5, max: 9, id: '1359365393106448829' },
    { min: 1, max: 4, id: '1359365239384260582' },
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

// --- REGISTRO DE COMANDOS SLASH ---
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
    description: 'Muestra tu nivel y XP actual.',
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
    description: 'Abre la tienda de Zeus para comprar bendiciones y cosméticos de #semanal'
};

const dataPerfil = {
    name: 'perfil',
    description: 'Abre tu armario para elegir y equipar tus fondos y fuentes guardadas'
};

const dataCritica = {
    name: 'critica',
    description: 'Genera la tarjeta gráfica de evaluación semanal para un artista (Exclusivo Pepo)',
    options: [
        { name: 'artista', type: ApplicationCommandOptionType.User, description: 'El artista a evaluar', required: true },
        { name: 'foto', type: ApplicationCommandOptionType.Attachment, description: 'El dibujo o imagen a criticar', required: true },
        { name: 'lo_bueno', type: ApplicationCommandOptionType.String, description: 'Aspectos positivos / Lo fuerte', required: true },
        { name: 'lo_malo', type: ApplicationCommandOptionType.String, description: 'Aspectos a corregir / El freno', required: true },
        { name: 'resumen', type: ApplicationCommandOptionType.String, description: 'Veredicto final de Pepo', required: true }
    ]
};

const dataSetBg = {
    name: 'setbg',
    description: 'Registra un nuevo fondo para la tienda de Zeus (Exclusivo Pepo)',
    options: [
        { name: 'nombre_id', type: ApplicationCommandOptionType.String, description: 'ID o nombre corto del fondo (ej: cartel_neon)', required: true },
        { name: 'imagen', type: ApplicationCommandOptionType.Attachment, description: 'La imagen del fondo/cartel', required: true },
        { name: 'precio', type: ApplicationCommandOptionType.Integer, description: 'Precio en XP', required: true },
        { name: 'nivel', type: ApplicationCommandOptionType.Integer, description: 'Nivel mínimo para comprarlo', required: true }
    ]
};

client.once('ready', async () => {
    console.log(`Bot prendido como ${client.user.tag}! Zeus ya anda zumbando > < :v`);

    try {
        await client.application.commands.create(dataAddXp);
        await client.application.commands.create(dataQuitarXp);
        await client.application.commands.create(dataVerXp);
        await client.application.commands.create(dataTop);
        await client.application.commands.create(dataComprar);
        await client.application.commands.create(dataPerfil);
        await client.application.commands.create(dataCritica);
        await client.application.commands.create(dataSetBg);
        console.log('Comandos listos compa > < :v');
    } catch (error) {
        console.error('Error con los comandos:', error);
    }
});

// --- REVISIÓN CADA MINUTO PARA QUITAR ROLES EXPIRADOS (24 Horas)[span_21](start_span)[span_21](end_span) ---
setInterval(async () => {
    try {
        const ahora = new Date();

        // Revisa expiración de XP x2[span_22](start_span)[span_22](end_span)
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

        // Revisa expiración de Canales Ocultos[span_23](start_span)[span_23](end_span)
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

// --- FUNCIONES HELPER DE ROLES ---
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

// --- FUNCIÓN CANVAS PARA LA FICHA (CON ESPACIADO MEJORADO) ---
async function generarTarjetaCritica({ dibujoUrl, artistaNombre, loBueno, loMalo, resumen, cartel, fuente }) {
    const width = 1000;
    const height = 600;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    try {
        const bgPath = path.join(__dirname, 'backgrounds', `${cartel || 'cartel_base'}.png`);
        const fondoImg = await loadImage(bgPath);
        ctx.drawImage(fondoImg, 0, 0, width, height);
    } catch (e) {
        ctx.fillStyle = '#121216';
        ctx.fillRect(0, 0, width, height);
    }

    ctx.fillStyle = 'rgba(18, 18, 24, 0.90)';
    ctx.roundRect(30, 30, width - 60, height - 60, 20);
    ctx.fill();

    try {
        const dibujoImg = await loadImage(dibujoUrl);
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(50, 50, 400, 500, 15);
        ctx.clip();
        ctx.drawImage(dibujoImg, 50, 50, 400, 500);
        ctx.restore();
    } catch (err) {
        console.error("Error al cargar dibujo:", err);
    }

    const fontName = fuente || 'sans-serif';
    
    ctx.fillStyle = '#FFD700';
    ctx.font = `bold 26px ${fontName}`;
    ctx.fillText(`🎨 EVALUACIÓN: @${artistaNombre}`, 480, 85);

    ctx.strokeStyle = '#3A3A4A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(480, 105);
    ctx.lineTo(940, 105);
    ctx.stroke();

    const wrapText = (context, label, text, colorLabel, x, startY, maxWidth, lineHeight) => {
        context.font = `bold 20px ${fontName}`;
        context.fillStyle = colorLabel;
        context.fillText(label, x, startY);
        
        context.font = `18px ${fontName}`;
        context.fillStyle = '#E2E2E8';
        
        const words = text.split(' ');
        let line = '';
        let currentY = startY + 28;

        for (let n = 0; n < words.length; n++) {
            let testLine = line + words[n] + ' ';
            let metrics = context.measureText(testLine);
            if (metrics.width > maxWidth && n > 0) {
                context.fillText(line, x, currentY);
                line = words[n] + ' ';
                currentY += lineHeight;
            } else {
                line = testLine;
            }
        }
        context.fillText(line, x, currentY);
        return currentY + 35;
    };

    let nextY = wrapText(ctx, '🟢 LO FUERTE:', loBueno, '#4EAE50', 480, 140, 450, 26);
    nextY = wrapText(ctx, '🔴 EL FRENO:', loMalo, '#F44336', 480, nextY, 450, 26);
    wrapText(ctx, '⚡ VEREDICTO DE PEPO:', resumen, '#FFC107', 480, nextY, 450, 26);

    return canvas.toBuffer('image/png');
}

// --- EVENTO DE MENSAJES PARA XP ACTIVO[span_24](start_span)[span_24](end_span) ---
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
    } else if (/<@&?\d+>/.test(message.content)) {
        xpGanada = 1 + (message.content.match(/<@&?\d+>/g) || []).length;
    }

    if (message.member) {
        if (message.member.roles.cache.has(ROL_XP_X4)) {
            xpGanada *= 4;
        } else if (message.member.roles.cache.has(ROL_XP_X2) || message.member.roles.cache.has(ROL_OCULTO)) {
            xpGanada *= 2;
        }
    }

    try {
        let userXpData = await UserXP.findOne({ userId, guildId });
        if (!userXpData) {
            userXpData = new UserXP({ userId, guildId, xp: 0, level: 1 });
        }

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
        await actualizarRolesTop(message.guild);

        if (subioNivel) {
            const levelEmbed = new EmbedBuilder()
                .setColor('#00ffaa')
                .setAuthor({ name: 'Subida de Nivel!', iconURL: message.author.displayAvatarURL() })
                .setThumbnail(message.author.displayAvatarURL({ dynamic: true, size: 512 }))
                .setDescription(`<@${message.author.id}> has sido ayudado por Zeus, subiste de nivel 🔥`)
                .addFields(
                    { name: '🌟 Tu Nuevo nivel es:', value: `**${userXpData.level}**`, inline: true },
                    { name: '✨ Esta es tu XP:', value: `**${userXpData.xp}** / ${userXpData.level * 100}`, inline: true }
                )
                .setFooter({ text: 'Sistema de XP • Zeus', iconURL: client.user.displayAvatarURL() });

            await message.channel.send({ embeds: [levelEmbed] });
        }

        if (message.member) {
            await checkearRoles(message.member, userXpData.level, message.guild);
        }
    } catch (error) {
        console.error('Clavo con la XP en mensajes:', error);
    }
});

// --- MANEJADOR DE INTERACCIONES ---
client.on('interactionCreate', async (interaction) => {
    
    // A. COMANDOS DE XP / ADMIN Y TIENDA
    if (interaction.isChatInputCommand()) {
        const { commandName } = interaction;

        if (commandName === 'añadir-xp') {
            await interaction.deferReply();
            const targetUser = interaction.options.getUser('usuario');
            const cantidad = interaction.options.getInteger('cant');
            const guildId = interaction.guild.id;
            const targetId = targetUser.id;

            try {
                let userXpData = await UserXP.findOne({ userId: targetId, guildId });
                if (!userXpData) userXpData = new UserXP({ userId: targetId, guildId, xp: 0, level: 1 });

                userXpData.xp += cantidad;
                let xpReq = userXpData.level * 100;
                while (userXpData.xp >= xpReq) {
                    userXpData.xp -= xpReq;
                    userXpData.level += 1;
                    xpReq = userXpData.level * 100;
                }

                await userXpData.save();
                await actualizarRolesTop(interaction.guild);

                const adminEmbed = new EmbedBuilder()
                    .setColor('#FFD700')
                    .setAuthor({ name: 'XP Puesta por Admin', iconURL: targetUser.displayAvatarURL() })
                    .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 512 }))
                    .setDescription(`<@${targetId}> Haz sido ayudado por Zeus, se te sumó **+${cantidad} XP**`)
                    .addFields(
                        { name: '🌟 Tu Nuevo nivel es:', value: `**${userXpData.level}**`, inline: true },
                        { name: '✨ Esta es tu XP:', value: `**${userXpData.xp}** / ${userXpData.level * 100}`, inline: true }
                    )
                    .setFooter({ text: 'Panel de Administración • Zeus', iconURL: client.user.displayAvatarURL() });

                await interaction.editReply({ embeds: [adminEmbed] });
                const member = interaction.guild.members.cache.get(targetId);
                if (member) await checkearRoles(member, userXpData.level, interaction.guild);
            } catch (err) {
                console.error(err);
                await interaction.editReply('Puchica, algo tronó con la base de datos.');
            }
            return;
        }

        if (commandName === 'quitar-xp') {
            await interaction.deferReply();
            const targetUser = interaction.options.getUser('usuario');
            const cantidad = interaction.options.getInteger('cant');
            const guildId = interaction.guild.id;
            const targetId = targetUser.id;

            try {
                let userXpData = await UserXP.findOne({ userId: targetId, guildId });
                if (!userXpData) {
                    return await interaction.editReply('Puchica, ese maje ni siquiera tiene registro.');
                }

                userXpData.xp -= cantidad;
                while (userXpData.xp < 0 && userXpData.level > 1) {
                    userXpData.level -= 1;
                    let xpAnterior = userXpData.level * 100;
                    userXpData.xp += xpAnterior;
                }
                if (userXpData.xp < 0) userXpData.xp = 0;

                await userXpData.save();
                await actualizarRolesTop(interaction.guild);

                const adminEmbed = new EmbedBuilder()
                    .setColor('#FF4747')
                    .setAuthor({ name: 'XP Quitada por Admin', iconURL: targetUser.displayAvatarURL() })
                    .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 512 }))
                    .setDescription(`<@${targetId}> Zeus te ha castigado, se te restó XP.`)
                    .addFields(
                                            { name: '✨ Esta es tu XP:', value: `**${userXpData.xp}** / ${userXpData.level * 100}`, inline: true }
                )
                .setFooter({ text: 'Panel de Administración • Zeus', iconURL: client.user.displayAvatarURL() });

            await interaction.editReply({ embeds: [adminEmbed] });
            const member = interaction.guild.members.cache.get(targetId);
            if (member) await checkearRoles(member, userXpData.level, interaction.guild);
        } catch (err) {
            console.error(err);
            await interaction.editReply('Puchica, algo tronó feo con la base de datos.');
        }
        return;
    }

    if (commandName === 'xp') {
        await interaction.deferReply();
        const targetUser = interaction.options.getUser('usuario') || interaction.user;
        const guildId = interaction.guild.id;

        try {
            let userXpData = await UserXP.findOne({ userId: targetUser.id, guildId });
            const xp = userXpData ? userXpData.xp : 0;
            const lvl = userXpData ? userXpData.level : 1;
            const xpNecesaria = lvl * 100;

            const xpEmbed = new EmbedBuilder()
                .setColor('#3B82F6')
                .setAuthor({ name: `Nivel y XP de ${targetUser.username}`, iconURL: targetUser.displayAvatarURL() })
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 512 }))
                .setDescription('Consulta de experiencia en el servidor 🔥')
                .addFields(
                    { name: '🌟 Nivel actual:', value: `**${lvl}**`, inline: true },
                    { name: '✨ Puntos de XP:', value: `**${xp}** / ${xpNecesaria}`, inline: true }
                )
                .setFooter({ text: 'Consulta de XP • Zeus', iconURL: client.user.displayAvatarURL() });

            return await interaction.editReply({ embeds: [xpEmbed] });
        } catch (err) {
            console.error(err);
            return await interaction.editReply('Puchica, algo tronó feo al intentar ver tu XP.');
        }
    }

    if (commandName === 'top') {
        await interaction.deferReply();
        try {
            await actualizarRolesTop(interaction.guild);
            const topUsers = await UserXP.find({ guildId: interaction.guild.id }).sort({ level: -1, xp: -1 }).limit(10);

            if (!topUsers.length) return await interaction.editReply('Aún no hay nadie registrado en la tabla de XP.');

            const medallas = ['🥇', '🥈', '🥉'];
            let descripcionTop = '';

            for (let i = 0; i < topUsers.length; i++) {
                const u = topUsers[i];
                const medalla = medallas[i] || `**#${i + 1}**`;
                const maxXP = u.level * 100;
                descripcionTop += `${medalla} <@${u.userId}> - **Nivel ${u.level}** (${u.xp}/${maxXP} XP)\n`;
            }

            const topEmbed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle('🏆 Leaderboard - Top 10 del Servidor')
                .setThumbnail(interaction.guild.iconURL({ dynamic: true }) || client.user.displayAvatarURL())
                .setDescription(descripcionTop)
                .setFooter({ text: 'Tabla de Clasificación • Zeus', iconURL: client.user.displayAvatarURL() });

            return await interaction.editReply({ embeds: [topEmbed] });
        } catch (err) {
            console.error(err);
            return await interaction.editReply('Puchica algo tronó feo al sacar el top.');
        }
    }
}

// 1. ABRIR TIENDA
if (interaction.isChatInputCommand() && interaction.commandName === 'comprar') {
    const tiendaEmbed = new EmbedBuilder()
        .setColor('#00ffaa')
        .setTitle('🛒 Tienda de Bendiciones de Zeus')
        .setDescription('Gasta tu XP acumulada para obtener ventajas temporales por 1 día 🔥')
        .addFields(
            { name: '⚡ Rol XP X2 (3,000 XP)', value: 'Zeus te bendecirá dándote XP X2 a cambio de una inversión por 1 día.' },
            { name: '👁️ Canales Ocultos (5,000 XP)', value: 'Zeus te dejará ver **canales ocultos** por 1 día.' },
            { name: '🎁 Caja de Regalo de Zeus (2,000 XP)', value: '¡Probá tu suerte! Abrí una caja misteriosa de Zeus.' },
            { name: '🖼️ Cartel Neón (4,000 XP)', value: 'Desbloquea el marco neón para `#semanal`.' },
            { name: '📜 Cartel Pergamino (6,000 XP)', value: 'Desbloquea el estilo antiguo/gótico.' },
            { name: '✍️ Fuente Gótica (2,500 XP)', value: 'Desbloquea la tipografía de estatus.' }
        )
        .setFooter({ text: 'Tienda Oficial • Zeus', iconURL: client.user.displayAvatarURL() });

    const menuSelec = new StringSelectMenuBuilder()
        .setCustomId('tienda_menu')
        .setPlaceholder('Elegí un producto para comprar...')
        .addOptions([
            { label: 'Rol XP X2 (3,000 XP)', description: 'Duplica tu XP ganada por 1 día', value: 'comprar_x2', emoji: '⚡' },
            { label: 'Canales Ocultos (5,000 XP)', description: 'Acceso a canales ocultos por 1 día', value: 'comprar_ocultos', emoji: '👁️' },
            { label: 'Caja de Regalo (2,000 XP)', description: '¡Caja misteriosa de Zeus!', value: 'comprar_caja', emoji: '🎁' },
            { label: 'Cartel Neón (4,000 XP)', description: 'Fondo neón para #semanal', value: 'comprar_cartel_neon', emoji: '🖼️' },
            { label: 'Cartel Pergamino (6,000 XP)', description: 'Fondo pergamino para #semanal', value: 'comprar_cartel_pergamino', emoji: '📜' },
            { label: 'Fuente Gótica (2,500 XP)', description: 'Fuente gótica para #semanal', value: 'comprar_fuente_gotica', emoji: '✍️' }
        ]);

    const fila = new ActionRowBuilder().addComponents(menuSelec);
    await interaction.reply({ embeds: [tiendaEmbed], components: [fila] });
    return;
}
    // 2. PROCESO DE COMPRA EN EL MENÚ DESPLEGABLE
if (interaction.isStringSelectMenu() && interaction.customId === 'tienda_menu') {
    await interaction.deferReply({ ephemeral: true });
    const opcion = interaction.values[0];
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;

    try {
        let userXpData = await UserXP.findOne({ userId, guildId });
        if (!userXpData) userXpData = new UserXP({ userId, guildId, xp: 0, level: 1 });

        const obtenerXpTotal = (data) => {
            let total = data.xp;
            for (let i = 1; i < data.level; i++) {
                total += i * 100;
            }
            return total;
        };

        const recalcularProgreso = (data, nuevaXpTotal) => {
            let lvl = 1;
            let xpRestante = nuevaXpTotal;
            let xpReq = lvl * 100;
            while (xpRestante >= xpReq) {
                xpRestante -= xpReq;
                lvl++;
                xpReq = lvl * 100;
            }
            data.level = lvl;
            data.xp = xpRestante;
        };

        let xpTotalActual = obtenerXpTotal(userXpData);
        const DOS_DIAS_MS = 2 * 24 * 60 * 60 * 1000;
        const ahora = new Date();

        const verificarCooldown = (ultimaFecha) => {
            if (!ultimaFecha) return null;
            const tiempoPasado = ahora - new Date(ultimaFecha).getTime();
            if (tiempoPasado < DOS_DIAS_MS) {
                const restanteMs = DOS_DIAS_MS - tiempoPasado;
                const h = Math.floor(restanteMs / (1000 * 60 * 60));
                const m = Math.floor((restanteMs % (1000 * 60 * 60)) / (1000 * 60));
                return `${h}h y${m}m`;
            }
            return null;
        };

        if (opcion === 'comprar_x2') {
            const cooldownMs = verificarCooldown(userXpData.ultimoUsoX2);
            if (cooldownMs) return await interaction.editReply(`⏳ **¡Aguantá el coche, maje!** Ya compraste el Rol XP X2 hace poco. Tenés que esperar ${cooldownMs}.`);
            if (xpTotalActual < 3000) return await interaction.editReply('Puchica maje, no te alcanza. Tené en cuenta que cuesta 3,000 XP acumulada.');

            xpTotalActual -= 3000;
            recalcularProgreso(userXpData, xpTotalActual);
            userXpData.rolX2Hasta = new Date(ahora.getTime() + (24 * 60 * 60 * 1000));
            userXpData.ultimoUsoX2 = new Date(ahora);
            await userXpData.save();

            const rolObj = interaction.guild.roles.cache.get(ROL_XP_X2);
            if (rolObj) await interaction.member.roles.add(rolObj).catch(() => {});

            return await interaction.editReply('🔥 **¡Compra exitosa!** Le compraste el Rol XP X2 a Zeus por 1 día.');
        }

        if (opcion === 'comprar_ocultos') {
            const cooldownMs = verificarCooldown(userXpData.ultimoUsoOculto);
            if (cooldownMs) return await interaction.editReply(`👁️ **¡Aguantá el coche, maje!** Ya compraste el acceso a Canales Ocultos hace poco. Esperá ${cooldownMs}.`);
            if (xpTotalActual < 5000) return await interaction.editReply('Puchica maje, no te alcanza. Tené en cuenta que cuesta 5,000 XP acumulada.');

            xpTotalActual -= 5000;
            recalcularProgreso(userXpData, xpTotalActual);
            userXpData.rolOcultoHasta = new Date(ahora.getTime() + (24 * 60 * 60 * 1000));
            userXpData.ultimoUsoOculto = new Date(ahora);
            await userXpData.save();

            const rolObj = interaction.guild.roles.cache.get(ROL_OCULTO);
            if (rolObj) await interaction.member.roles.add(rolObj).catch(() => {});

            return await interaction.editReply('👁️ **¡Compra exitosa!** Le compraste el acceso a Canales Ocultos a Zeus por 1 día.');
        }

        if (opcion === 'comprar_caja') {
            const cooldownMs = verificarCooldown(userXpData.ultimoUsoCaja);
            if (cooldownMs) return await interaction.editReply(`🎁 **¡Aguantá el coche, maje!** Ya compraste tu Caja de Regalo. Esperá ${cooldownMs}.`);
            if (xpTotalActual < 2000) return await interaction.editReply('Puchica maje, no te alcanza. La Caja cuesta 2,000 XP acumulada.');

            xpTotalActual -= 2000;
            const xpGanadaAzar = Math.floor(Math.random() * (5000 - 500 + 1)) + 500;
            xpTotalActual += xpGanadaAzar;
            recalcularProgreso(userXpData, xpTotalActual);

            userXpData.ultimoUsoCaja = new Date(ahora);
            await userXpData.save();

            return await interaction.editReply(`🎁 **¡Abriste la Caja de Regalo de Zeus!**\nZeus te ha bendecido con **+${xpGanadaAzar} XP** al azar 🔥`);
        }

        if (opcion === 'comprar_cartel_neon' || opcion === 'comprar_cartel_pergamino') {
            const precio = opcion === 'comprar_cartel_neon' ? 4000 : 6000;
            const itemId = opcion === 'comprar_cartel_neon' ? 'cartel_neon' : 'cartel_pergamino';

            if (xpTotalActual < precio) return await interaction.editReply('Puchica maje, no te alcanza la XP.');
            
            if (!userXpData.cartelesComprados) userXpData.cartelesComprados = ['cartel_base'];
            if (userXpData.cartelesComprados.includes(itemId)) {
                userXpData.cartelEquipado = itemId;
                await userXpData.save();
                return await interaction.editReply(`¡Ya tenías este cartel! Te lo hemos **equipado** como tu fondo actual.`);
            }

            xpTotalActual -= precio;
            recalcularProgreso(userXpData, xpTotalActual);
            userXpData.cartelesComprados.push(itemId);
            userXpData.cartelEquipado = itemId;
            await userXpData.save();
            return await interaction.editReply(`🔥 ¡Felicidades! Compraste y equipaste tu **${itemId}** para las fichas de \`#semanal\`.`);
        }

        if (opcion === 'comprar_fuente_gotica') {
            const precio = 2500;
            if (xpTotalActual < precio) return await interaction.editReply('Puchica maje, no te alcanza la XP.');

            if (!userXpData.fuentesCompradas) userXpData.fuentesCompradas = ['sans-serif'];
            if (userXpData.fuentesCompradas.includes('gotica')) {
                userXpData.fuenteEquipada = 'gotica';
                await userXpData.save();
                return await interaction.editReply('¡Ya tenías esta fuente! Se ha **equipado** correctamente.');
            }

            xpTotalActual -= precio;
            recalcularProgreso(userXpData, xpTotalActual);
            userXpData.fuentesCompradas.push('gotica');
            userXpData.fuenteEquipada = 'gotica';
            await userXpData.save();
            return await interaction.editReply('✍️ ¡Compraste y equipaste la **Fuente Gótica**!');
        }

    } catch (err) {
        console.error('Clavo en la tienda:', err);
        await interaction.editReply('Puchica, algo tronó al intentar hacer la compra.');
    }
    return;
}

// 3. COMANDO /PERFIL (ARMARIO)
if (interaction.isChatInputCommand() && interaction.commandName === 'perfil') {
    await interaction.deferReply({ ephemeral: true });

    const userId = interaction.user.id;
    const guildId = interaction.guild.id;

    let userXpData = await UserXP.findOne({ userId, guildId });
    if (!userXpData) return await interaction.editReply('Puchica maje, aún no tenés registro de XP ni compras en Zeus.');

    const carteles = userXpData.cartelesComprados && userXpData.cartelesComprados.length > 0 ? userXpData.cartelesComprados : ['cartel_base'];
    const fuentes = userXpData.fuentesCompradas && userXpData.fuentesCompradas.length > 0 ? userXpData.fuentesCompradas : ['sans-serif'];

    const perfilEmbed = new EmbedBuilder()
        .setColor('#9b59b6')
        .setTitle(`🎨 Armario de Cosméticos de ${interaction.user.username}`)
        .setDescription('Elegí cuál de tus fondos y fuentes compradas querés equipar para tus próximas fichas de `#semanal`!')
        .addFields(
            { name: '🖼️ Fondo Equipado Actual:', value: `\`${userXpData.cartelEquipado || 'cartel_base'}\``, inline: true },
            { name: '✍️ Fuente Equipada Actual:', value: `\`${userXpData.fuenteEquipada || 'sans-serif'}\``, inline: true }
        )
        .setFooter({ text: 'Zeus - Sistema de Personalización', iconURL: client.user.displayAvatarURL() });

    const opcionesCarteles = carteles.map(c => ({ label: `Fondo: ${c}`, value: `equipar_cartel_${c}`, emoji: '🖼️' }));
    const menuCarteles = new StringSelectMenuBuilder().setCustomId('equipar_cartel_menu').setPlaceholder('Elegí un fondo para equipar...').addOptions(opcionesCarteles);

    const opcionesFuentes = fuentes.map(f => ({ label: `Fuente: ${f}`, value: `equipar_fuente_${f}`, emoji: '✍️' }));
    const menuFuentes = new StringSelectMenuBuilder().setCustomId('equipar_fuente_menu').setPlaceholder('Elegí una fuente para equipar...').addOptions(opcionesFuentes);

    const filaCarteles = new ActionRowBuilder().addComponents(menuCarteles);
    const filaFuentes = new ActionRowBuilder().addComponents(menuFuentes);

    await interaction.editReply({ embeds: [perfilEmbed], components: [filaCarteles, filaFuentes] });
    return;
}

if (interaction.isStringSelectMenu() && (interaction.customId === 'equipar_cartel_menu' || interaction.customId === 'equipar_fuente_menu')) {
    await interaction.deferReply({ ephemeral: true });

    const seleccion = interaction.values[0];
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;

    let userXpData = await UserXP.findOne({ userId, guildId });

    if (interaction.customId === 'equipar_cartel_menu') {
        const itemElegido = seleccion.replace('equipar_cartel_', '');
        userXpData.cartelEquipado = itemElegido;
        await userXpData.save();
        return await interaction.editReply(`✅ ¡Nítido! Ahora tenés equipado el fondo **${itemElegido}**.`);
    }

    if (interaction.customId === 'equipar_fuente_menu') {
        const itemElegido = seleccion.replace('equipar_fuente_', '');
        userXpData.fuenteEquipada = itemElegido;
        await userXpData.save();
        return await interaction.editReply(`✅ ¡Nítido! Ahora tenés equipada la fuente **${itemElegido}**.`);
    }
}

// 5. COMANDO /SETBG (EXCLUSIVO PEPO)
if (interaction.isChatInputCommand() && interaction.commandName === 'setbg') {
    if (interaction.user.id !== PEPO_ID) {
        return await interaction.reply({ content: '❌ **¡Aguantá el coche, maje!** Este comando solo lo puede usar Pepo.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });
    const nombreId = interaction.options.getString('nombre_id');
    const imagen = interaction.options.getAttachment('imagen');
    const precio = interaction.options.getInteger('precio');
    const nivel = interaction.options.getInteger('nivel');

    await interaction.editReply(`✅ ¡Fondo **${nombreId}** subido al servidor!\n💰 Precio: **${precio} XP**\n⭐ Nivel requerido: **Nivel ${nivel}**\n🔗 URL: ${imagen.url}`);
    return;
}

// 6. COMANDO /CRITICA (EXCLUSIVO PEPO)
if (interaction.isChatInputCommand() && interaction.commandName === 'critica') {
    if (interaction.user.id !== PEPO_ID) {
        return await interaction.reply({ content: '❌ **¡Aguantá el coche, maje!** Este comando solo lo puede usar Pepo para las críticas de `#semanal`.', ephemeral: true });
    }

    await interaction.deferReply();
    const artista = interaction.options.getUser('artista');
    const foto = interaction.options.getAttachment('foto');
    const loBueno = interaction.options.getString('lo_bueno');
    const loMalo = interaction.options.getString('lo_malo');
    const resumen = interaction.options.getString('resumen');

    try {
        let datosArtista = await UserXP.findOne({ userId: artista.id, guildId: interaction.guild.id });
        const cartelUsar = datosArtista?.cartelEquipado || 'cartel_base';
        const fuenteUsar = datosArtista?.fuenteEquipada || 'sans-serif';

        const bufferFicha = await generarTarjetaCritica({
            dibujoUrl: foto.url,
            artistaNombre: artista.username,
            loBueno: loBueno,
            loMalo: loMalo,
            resumen: resumen,
            cartel: cartelUsar,
            fuente: fuenteUsar
        });

        const attachment = new AttachmentBuilder(bufferFicha, { name: `critica_${artista.username}.png` });

        await interaction.editReply({
            content: `🎨 **EVALUACIÓN OFICIAL DE #SEMANAL PARA** <@${artista.id}>`,
            files: [attachment]
        });
    } catch (error) {
        console.error('Error al generar la ficha:', error);
        await interaction.editReply('Puchica maje, algo falló al renderizar la ficha en Canvas.');
    }
}
});

client.login(process.env.TOKEN || process.env.DISCORD_TOKEN);
            

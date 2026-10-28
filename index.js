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

// TU ID Y ROLES DE TIENDA
const PEPO_ID = '1259006426978713620';
const ROL_XP_X4 = '123456789012345678';
const ROL_XP_X2 = '1545950431908470865';
const ROL_OCULTO = '1545963099788410950';

// --- LISTA DE ROLES DE XP POR NOMBRE ---
const nivelesRoles = [
    { min: 1, max: 5, nombre: 'Madera' },
    { min: 5, max: 10, nombre: 'Cobre' },
    { min: 10, max: 15, nombre: 'Bronce' },
    { min: 15, max: 20, nombre: 'Plata' },
    { min: 20, max: 30, nombre: 'Oro' },
    { min: 30, max: 40, nombre: 'Diamante' },
    { min: 40, max: 50, nombre: 'Esmeralda' },
    { min: 50, max: 60, nombre: 'Rubí' },
    { min: 60, max: 70, nombre: 'Amatista' },
    { min: 70, max: 80, nombre: 'Jade' },
    { min: 80, max: 100, nombre: 'Obsidiana' },
    { min: 100, max: 125, nombre: 'Cumbre' },
    { min: 125, max: 150, nombre: 'Asteroide' },
    { min: 150, max: 200, nombre: 'meteoro' },
    { min: 200, max: 250, nombre: 'cometa de hielo' },
    { min: 250, max: 300, nombre: 'cinturon de asteroides' },
    { min: 300, max: 350, nombre: 'Luna' },
    { min: 350, max: 400, nombre: 'Planeta' },
    { min: 400, max: 450, nombre: 'Gigante Gaseoso' },
    { min: 450, max: 500, nombre: 'Nebulosa' },
    { min: 500, max: 550, nombre: 'Enana blanca' },
    { min: 550, max: 600, nombre: 'Estrella' },
    { min: 600, max: 650, nombre: 'Gigante Roja' },
    { min: 650, max: 700, nombre: 'SuperNova' },
    { min: 700, max: 750, nombre: 'Estrella de Neutrones' },
    { min: 750, max: 800, nombre: 'Agujero Negro' },
    { min: 800, max: 850, nombre: 'Gargantua' },
    { min: 850, max: 1000, nombre: 'Cuasar' },
    { min: 1000, max: 99999, nombre: 'Bing-Bang' }
];

// --- LISTA DE ROLES DE RACHAS ---
const rachasRoles = [
    { dias: 1, nombre: 'Chispa', emoji: '✨' },
    { dias: 5, nombre: 'Llama', emoji: '🔥' },
    { dias: 10, nombre: 'Fogata', emoji: '🪵' },
    { dias: 20, nombre: 'Incendio', emoji: '🔥' },
    { dias: 50, nombre: 'magma', emoji: '🪨' },
    { dias: 100, nombre: 'volcán', emoji: '🌋' },
    { dias: 365, nombre: 'placa tectónica', emoji: '⛰️' }
];

mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI)
    .then(() => console.log('Base de datos conectada al 100 > :v'))
    .catch(err => console.error('Puchica fallo la base de datos:', err))

// --- COMANDOS ---
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
        total += i * 1000;
    }
    return total;
};

const recalcularProgreso = (data, nuevoXpTotal) => {
    let lvl = 1;
    let xpRestante = nuevoXpTotal;
    let xpReq = lvl * 1000;

    while (xpRestante >= xpReq) {
        xpRestante -= xpReq;
        lvl++;
        xpReq = lvl * 1000;
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
        return `${h}h y ${m}m`;
    }
    return null;
};

// --- GESTIÓN DE ROLES DE XP ---
async function checkearRolesPorNombre(member, nivelActual, guild) {
    try {
        const rangoEncontrado = nivelesRoles.find(r => nivelActual >= r.min && nivelActual < r.max);
        if (!rangoEncontrado) return;

        const nombresDeNiveles = nivelesRoles.map(r => r.nombre.toLowerCase());
        const rolesAQuitar = member.roles.cache.filter(r => {
            const nombreRolLower = r.name.toLowerCase();
            return nombresDeNiveles.some(n => nombreRolLower.includes(n)) && !nombreRolLower.includes(rangoEncontrado.nombre.toLowerCase());
        });

        if (rolesAQuitar.size > 0) await member.roles.remove(rolesAQuitar);

        const rolNuevoObj = guild.roles.cache.find(r => r.name.toLowerCase().includes(rangoEncontrado.nombre.toLowerCase()));
        if (rolNuevoObj && !member.roles.cache.has(rolNuevoObj.id)) {
            await member.roles.add(rolNuevoObj);
        }
    } catch (err) {
        console.error("Clavo intentando actualizar rol de nivel:", err);
    }
}

// --- GESTIÓN DE RACHAS Y APODOS ---
async function procesarRachaYApodo(message, userXpData) {
    try {
        const member = message.member;
        const ahora = new Date();
        const hoyStr = ahora.toISOString().split('T')[0];

        let ultimaStr = userXpData.lastActiveDate ? new Date(userXpData.lastActiveDate).toISOString().split('T')[0] : null;

        if (ultimaStr !== hoyStr) {
            if (!userXpData.lastActiveDate) {
                userXpData.streak = 1;
            } else {
                const ultimaFecha = new Date(userXpData.lastActiveDate);
                const diffDias = Math.floor((ahora - ultimaFecha) / (1000 * 60 * 60 * 24));

                if (diffDias === 1) {
                    userXpData.streak += 1;
                } else if (diffDias > 1) {
                    userXpData.streak = 1;
                }
            }
            userXpData.lastActiveDate = ahora;
            await userXpData.save();

            let emojiRacha = '✨';
            const rachaActual = userXpData.streak;

            const configRacha = rachasRoles.slice().reverse().find(r => rachaActual >= r.dias);
            if (configRacha) emojiRacha = configRacha.emoji;

            let nombreLimpio = member.nickname || member.user.username;
            nombreLimpio = nombreLimpio.replace(/\s*\|\s*\d+\s*[\u{1F300}-\u{1F5FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
            
            const nuevoApodo = `${nombreLimpio} | ${rachaActual} ${emojiRacha}`;
            if (nuevoApodo.length <= 32) {
                await member.setNickname(nuevoApodo).catch(e => console.log("No se pudo cambiar el apodo:", e.message));
            }

            const rachaRolMatch = rachasRoles.slice().reverse().find(r => rachaActual >= r.dias);
            if (rachaRolMatch) {
                const nombresRachas = rachasRoles.map(r => r.nombre.toLowerCase());
                const rolesRachaAQuitar = member.roles.cache.filter(r => {
                    const n = r.name.toLowerCase();
                    return nombresRachas.some(nr => n.includes(nr)) && !n.includes(rachaRolMatch.nombre.toLowerCase());
                });
                if (rolesRachaAQuitar.size > 0) await member.roles.remove(rolesRachaAQuitar);

                const rolRachaObj = message.guild.roles.cache.find(r => r.name.toLowerCase().includes(rachaRolMatch.nombre.toLowerCase()));
                if (rolRachaObj && !member.roles.cache.has(rolRachaObj.id)) {
                    await member.roles.add(rolRachaObj);
                }
            }
        }
    } catch (err) {
        console.error("Error procesando racha:", err);
    }
}

// --- SISTEMA DE XP Y MENSAJES ---
client.on('messageCreate', async message => {
    if (message.author.bot || !message.guild) return;

    const userId = message.author.id;
    const guildId = message.guild.id;

    let xpGanada = 3;
    if (message.attachments.size > 0) {
        const attachment = message.attachments.first();
        const tipo = attachment.contentType || '';
        if (tipo.startsWith('image/')) xpGanada = 8;
        else if (tipo.startsWith('video/')) xpGanada = 10;
        else if (tipo.startsWith('audio/')) xpGanada = 5;
    } else if (message.content.includes('giphy.com') || message.content.includes('tenor.com')) {
        xpGanada = 8;
    }

    if (message.member) {
        if (message.member.roles.cache.has(ROL_XP_X4)) xpGanada *= 4;
        else if (message.member.roles.cache.has(ROL_XP_X2)) xpGanada *= 2;
    }

    try {
        let userXpData = await UserXP.findOne({ userId, guildId });
        if (!userXpData) {
            userXpData = new UserXP({ userId, guildId, xp: 0, level: 1, streak: 0 });
        }

        await procesarRachaYApodo(message, userXpData);

        userXpData.xp += xpGanada;
        let xpNecesaria = userXpData.level * 1000;
        let subioNivel = false;

        while (userXpData.xp >= xpNecesaria) {
            userXpData.xp -= xpNecesaria;
            userXpData.level += 1;
            xpNecesaria = userXpData.level * 1000;
            subioNivel = true;
        }

        await userXpData.save();

    try {
        if (subioNivel) {
            const levelEmbed = new EmbedBuilder()
                .setColor('#00ffaa')
                .setAuthor({ name: '¡Subida de Nivel!', iconURL: message.author.displayAvatarURL() })
                .setThumbnail(message.author.displayAvatarURL({ dynamic: true, size: 512 }))
                .setDescription(`<@${userId}> Has sido ayudado por Zeus, subiste de nivel 🔥`)
                .addFields(
                    { name: '⭐ Tu Nuevo nivel es:', value: `**${userXpData.level}**`, inline: true },
                    { name: '✨ Esta estu XP:', value: `**${userXpData.xp} / ${userXpData.level * 1000}**`, inline: true }
                )
                .setFooter({ text: 'Sistema de XP • Zeus', iconURL: client.user.displayAvatarURL() });

            // ID de tu canal exclusivo de Niveles
const CANAL_NIVELES_ID = "1346670096789278730";

const canalNiveles = message.guild.channels.cache.get(CANAL_NIVELES_ID);
if (canalNiveles) {
    await canalNiveles.send({ embeds: [levelEmbed] });
}

        if (message.member) {
            await checkearRolesPorNombre(message.member, userXpData.level, message.guild);
        }
    } catch (error) {
        console.error("Clavo con la XP:", error);
    }

// --- COMANDOS SLASH ---
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
            const racha = userXp ? userXp.streak : 0;
            const xpSiguiente = level * 1000;

            const embedXp = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle(`⭐ Nivel y Estadísticas de ${target.username}`)
                .addFields(
                    { name: '⭐ Nivel Actual:', value: `**${level}**`, inline: true },
                    { name: '✨ XP Acumulada:', value: `**${xp} / ${xpSiguiente}**`, inline: true },
                    { name: '🔥 Racha Actual:', value: `**${racha} días**`, inline: true }
                )
                .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: 'Zeus XP & Streak System', iconURL: client.user.displayAvatarURL() });

            return await interaction.editReply({ embeds: [embedXp] });
        } catch (err) {
            console.error("Error en /xp:", err);
            if (interaction.deferred) return await interaction.editReply(`❌ Error al cargar datos: \`${err.message}\``);
        }
    }

    if (commandName === 'top') {
        try {
            await interaction.deferReply();
            const topUsers = await UserXP.find({ guildId: interaction.guild.id }).sort({ level: -1, xp: -1 }).limit(10);
            if (!topUsers || topUsers.length === 0) return await interaction.editReply('❌ No hay registros todavía.');

            let desc = topUsers.map((u, i) => {
                const medalla = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `**#${i + 1}**`;
                return `${medalla} <@${u.userId}> — **Nivel ${u.level}** (${u.xp} XP) | 🔥 ${u.streak} días`;
            }).join('\n');

            const embedTop = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle('🏆 TOP 10 MAJES CON MÁS XP Y RACHAS')
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
        if (interaction.user.id !== PEPO_ID) return await interaction.reply({ content: '❌ Solo Pepo.', ephemeral: true });
        await interaction.deferReply();
        const target = interaction.options.getUser('usuario');
        const cant = interaction.options.getInteger('cant');

        let userXp = await UserXP.findOne({ userId: target.id, guildId: interaction.guild.id });
        if (!userXp) userXp = new UserXP({ userId: target.id, guildId: interaction.guild.id, xp: 0, level: 1 });

        userXp.xp += cant;
        let xpNecesaria = userXp.level * 1000;
        while (userXp.xp >= xpNecesaria) {
            userXp.xp -= xpNecesaria;
            userXp.level += 1;
            xpNecesaria = userXp.level * 1000;
        }
        await userXp.save();
        return await interaction.editReply(`👑 Se sumaron **+${cant} XP** a <@${target.id}>. Nuevo nivel: **${userXp.level}**`);
    }

    if (commandName === 'quitar-xp') {
        if (interaction.user.id !== PEPO_ID) return await interaction.reply({ content: '❌ Solo Pepo.', ephemeral: true });
        await interaction.deferReply();
        const target = interaction.options.getUser('usuario');
        const cant = interaction.options.getInteger('cant');

        let userXp = await UserXP.findOne({ userId: target.id, guildId: interaction.guild.id });
        if (!userXp) return await interaction.editReply('❌ Sin registros.');
        userXp.xp = Math.max(0, userXp.xp - cant);
        await userXp.save();
        return await interaction.editReply(`⚠️ Se restaron **-${cant} XP** a <@${target.id}>.`);
    }

            if (commandName === 'comprar') {
        await interaction.deferReply({ ephemeral: true });
        const tiendaEmbed = new EmbedBuilder()
            .setColor('#00ffaa')
            .setTitle('⚡ Tienda de Bendiciones de Zeus')
            .addFields(
                { name: '⚡ Rol XP X2 (3,000 XP)', value: 'Duplica tu XP por 1 día.' },
                { name: '👁️ Canales Ocultos (5,000 XP)', value: 'Acceso a canales ocultos por 1 día.' },
                { name: '🎁 Caja de Regalo (2,000 XP)', value: 'Caja misteriosa de Zeus.' }
            );

        const menuSelec = new StringSelectMenuBuilder()
            .setCustomId('tienda_menu')
            .setPlaceholder('Elegí una bendición...')
            .addOptions([
                { label: 'Rol XP X2 (3,000 XP)', description: 'Duplica XP por 1 día', value: 'comprar_x2', emoji: '⚡' },
                { label: 'Canales Ocultos (5,000 XP)', description: 'Canales ocultos por 1 día', value: 'comprar_ocultos', emoji: '👁️' },
                { label: 'Caja de Regalo (2,000 XP)', description: 'Caja misteriosa', value: 'comprar_caja', emoji: '🎁' }
            ]);

        const fila = new ActionRowBuilder().addComponents(menuSelec);
        return await interaction.editReply({ embeds: [tiendaEmbed], components: [fila] });
    }
});

// --- TIENDA SELECCIÓN ---
client.on('interactionCreate', async interaction => {
    if (!interaction.isStringSelectMenu()) return;
    if (interaction.customId === 'tienda_menu') {
        await interaction.deferReply({ ephemeral: true });
        const opcion = interaction.values[0];
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        let userXpData = await UserXP.findOne({ userId, guildId });
        if (!userXpData) userXpData = new UserXP({ userId, guildId, xp: 0, level: 1 });

        const ahora = Date.now();
        const xpTotalActual = obtenerXpTotal(userXpData);

        if (opcion === 'comprar_x2') {
            const cooldownMsg = verificarCooldown(userXpData.ultimoUsoX2);
            if (cooldownMsg) return await interaction.editReply(`⌛ Esperá **${cooldownMsg}** para volver a comprar esto.`);
            if (xpTotalActual < 3000) return await interaction.editReply(`❌ No te alcanza (cuesta 3,000 XP).`);

            recalcularProgreso(userXpData, xpTotalActual - 3000);
            userXpData.rolX2Hasta = new Date(ahora + (24 * 60 * 60 * 1000));
            userXpData.ultimoUsoX2 = new Date(ahora);
            await userXpData.save();

            const member = await interaction.guild.members.fetch(userId);
            if (member) await member.roles.add(ROL_XP_X2);
            return await interaction.editReply(`🔥 ¡Compra exitosa del Rol XP X2!`);
        }

        if (opcion === 'comprar_ocultos') {
            const cooldownMsg = verificarCooldown(userXpData.ultimoUsoOculto);
            if (cooldownMsg) return await interaction.editReply(`⌛ Esperá **${cooldownMsg}**.`);
            if (xpTotalActual < 5000) return await interaction.editReply(`❌ No te alcanza (cuesta 5,000 XP).`);

            recalcularProgreso(userXpData, xpTotalActual - 5000);
            userXpData.rolOcultoHasta = new Date(ahora + (24 * 60 * 60 * 1000));
            userXpData.ultimoUsoOculto = new Date(ahora);
            await userXpData.save();

            const member = await interaction.guild.members.fetch(userId);
            if (member) await member.roles.add(ROL_OCULTO);
            return await interaction.editReply(`👁️ ¡Compra exitosa de Canales Ocultos!`);
        }

        if (opcion === 'comprar_caja') {
            const cooldownMsg = verificarCooldown(userXpData.ultimoUsoCaja);
            if (cooldownMsg) return await interaction.editReply(`⌛ Esperá **${cooldownMsg}**.`);
            if (xpTotalActual < 2000) return await interaction.editReply(`❌ No te alcanza (cuesta 2,000 XP).`);

            let nuevoTotal = xpTotalActual - 2000;
            const xpGanadaAzar = Math.floor(Math.random() * (5000 - 500 + 1)) + 500;
            nuevoTotal += xpGanadaAzar;

            recalcularProgreso(userXpData, nuevoTotal);
            userXpData.ultimoUsoCaja = new Date(ahora);
            await userXpData.save();
            return await interaction.editReply(`🎁 ¡Abriste la Caja de Zeus y ganaste **+${xpGanadaAzar} XP** al azar!`);
        }
    }
});

console.log('🔄 Conectando bot...');
client.login(process.env.DISCORD_TOKEN);

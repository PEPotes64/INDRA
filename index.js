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
    ActionRowBuilder,
    AttachmentBuilder
} = require('discord.js');
const mongoose = require('mongoose');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const path = require('path');
require('dotenv').config();

const UserXP = require('./UserXP.js');
const Background = require('./Background.js');

// --- MODELOS DE MONGO (FUENTES Y PACKS) ---
const fontSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    nombreId: { type: String, required: true },
    fontUrl: { type: String, required: true },
    precio: { type: Number, default: null },
    nivelMinimo: { type: Number, default: null }
});
const Font = mongoose.models.Font || mongoose.model('Font', fontSchema);

const packSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    nombreId: { type: String, required: true },
    fondoNombreId: { type: String, required: true },
    fuenteNombreId: { type: String, required: true },
    precio: { type: Number, default: null },
    nivelMinimo: { type: Number, default: null }
});
const Pack = mongoose.models.Pack || mongoose.model('Pack', packSchema);

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

const rolesTop3 = ['1541902325784912064', '1541902188895412405', '15418993453521330216'];

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
const dataComprar = { name: 'comprar', description: 'Abre la tienda de Zeus para comprar bendiciones temporales y cosméticos' };
const dataPerfil = { name: 'perfil', description: 'Abre tu armario de fondos y fuentes' };

const dataCritica = {
    name: 'critica',
    description: 'Genera la tarjeta gráfica para un artista (Exclusivo Pepo)',
    options: [
        { name: 'artista', type: ApplicationCommandOptionType.User, description: 'Artista', required: true },
        { name: 'foto', type: ApplicationCommandOptionType.Attachment, description: 'Dibujo', required: true },
        { name: 'lo_bueno', type: ApplicationCommandOptionType.String, description: 'Lo bueno', required: true },
        { name: 'lo_malo', type: ApplicationCommandOptionType.String, description: 'Lo malo', required: true },
        { name: 'resumen', type: ApplicationCommandOptionType.String, description: 'Resumen', required: true },
        { name: 'positivo', type: ApplicationCommandOptionType.Integer, description: 'Positivo %', required: false },
        { name: 'lineart', type: ApplicationCommandOptionType.Integer, description: 'Lineart %', required: false },
        { name: 'creatividad', type: ApplicationCommandOptionType.Integer, description: 'Creatividad %', required: false },
        { name: 'detalles', type: ApplicationCommandOptionType.Integer, description: 'Detalles %', required: false },
        { name: 'paleta', type: ApplicationCommandOptionType.Integer, description: 'Paleta %', required: false },
        { name: 'pinceles', type: ApplicationCommandOptionType.Integer, description: 'Pinceles %', required: false }
    ]
};

const dataSetBg = {
    name: 'setbg',
    description: 'Sube/asigna un fondo directo a MongoDB (Exclusivo Pepo)',
    options: [
        { name: 'nombre_id', type: ApplicationCommandOptionType.String, description: 'Nombre ID', required: true },
        { name: 'imagen', type: ApplicationCommandOptionType.Attachment, description: 'Imagen', required: true },
        { name: 'precio', type: ApplicationCommandOptionType.Integer, description: 'Precio', required: false },
        { name: 'nivel', type: ApplicationCommandOptionType.Integer, description: 'Nivel', required: false },
        { name: 'usuario', type: ApplicationCommandOptionType.User, description: 'Regalar', required: false }
    ]
};

const dataDelBg = {
    name: 'delbg',
    description: 'Borra un fondo de MongoDB (Exclusivo Pepo)',
    options: [
        { name: 'nombre_id', type: ApplicationCommandOptionType.String, description: 'Nombre ID', required: true }
    ]
};

const dataSetFont = {
    name: 'setfont',
    description: 'Sube una fuente .ttf/.otf al sistema (Exclusivo Pepo)',
    options: [
        { name: 'nombre_id', type: ApplicationCommandOptionType.String, description: 'Nombre ID de la fuente', required: true },
        { name: 'archivo', type: ApplicationCommandOptionType.Attachment, description: 'Archivo .ttf o .otf', required: true },
        { name: 'precio', type: ApplicationCommandOptionType.Integer, description: 'Precio en XP', required: false },
        { name: 'nivel', type: ApplicationCommandOptionType.Integer, description: 'Nivel mínimo', required: false },
        { name: 'usuario', type: ApplicationCommandOptionType.User, description: 'Regalar a usuario', required: false }
    ]
};

const dataSetPack = {
    name: 'setpack',
    description: 'Crea un Pack (Fondo + Fuente) (Exclusivo Pepo)',
    options: [
        { name: 'nombre_pack', type: ApplicationCommandOptionType.String, description: 'Nombre del Pack', required: true },
        { name: 'fondo_id', type: ApplicationCommandOptionType.String, description: 'Fondo existente', required: true },
        { name: 'fuente_id', type: ApplicationCommandOptionType.String, description: 'Fuente existente', required: true },
        { name: 'precio', type: ApplicationCommandOptionType.Integer, description: 'Precio combo', required: false },
        { name: 'nivel', type: ApplicationCommandOptionType.Integer, description: 'Nivel mínimo', required: false },
        { name: 'usuario', type: ApplicationCommandOptionType.User, description: 'Regalar pack', required: false }
    ]
};

client.once('ready', async () => {
    console.log(`Bot prendido como ${client.user.tag}! Zeus ya anda zumbando > :v`);

    // Sincronizar fuentes guardadas en Mongo con el Canvas de Render al arrancar
    try {
        const fuentesGuardadas = await Font.find({});
        for (const f of fuentesGuardadas) {
            try {
                const res = await fetch(f.fontUrl);
                const buffer = Buffer.from(await res.arrayBuffer());
                GlobalFonts.register(buffer, f.nombreId);
                console.log(`🔤 Fuente cargada y registrada: ${f.nombreId}`);
            } catch (e) {
                console.error(`Error cargando fuente ${f.nombreId}:`, e);
            }
        }
    } catch (err) {
        console.error("Error al sincronizar fuentes al inicio:", err);
    }

    try {
        await client.application.commands.create(dataAddXp);
        await client.application.commands.create(dataQuitarXp);
        await client.application.commands.create(dataVerXp);
        await client.application.commands.create(dataTop);
        await client.application.commands.create(dataComprar);
        await client.application.commands.create(dataPerfil);
        await client.application.commands.create(dataCritica);
        await client.application.commands.create(dataSetBg);
        await client.application.commands.create(dataDelBg);
        await client.application.commands.create(dataSetFont);
        await client.application.commands.create(dataSetPack);
        console.log('Comandos listos compa > :v');
    } catch (error) {
        console.error('Error con los comandos:', error);
    }
});

// --- HELPER DE OBTENER XP TOTAL ---
const obtenerXpTotal = (data) => {
    let total = data.xp;
    for (let i = 1; i < data.level; i++) {
        total += (i + 1) * 100;
    }
    return total;
};

// --- HELPER DE RECALCULAR PROGRESO ---
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

// --- HELPER DE COOLDOWNS ---
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

// --- MANEJADOR DE INTERACCIONES (COMANDOS SLASH) ---
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    // /xp
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
            if (interaction.deferred) {
                return await interaction.editReply(`❌ Error al cargar XP: \`${err.message}\``);
            }
        }
    }

    // /top
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
            if (interaction.deferred) {
                return await interaction.editReply(`❌ Error al cargar el top: \`${err.message}\``);
            }
        }
    }

    // /comprar (TIENDA UNIFICADA)
    if (commandName === 'comprar') {
        await interaction.deferReply();

        const fondosTienda = await Background.find({ guildId: interaction.guild.id, precio: { $ne: null } });
        const fuentesTienda = await Font.find({ guildId: interaction.guild.id, precio: { $ne: null } });
        const packsTienda = await Pack.find({ guildId: interaction.guild.id, precio: { $ne: null } });

        const tiendaEmbed = new EmbedBuilder()
            .setColor('#00ffaa')
            .setTitle('🎨 Tienda de Zeus & #semanal')
            .setDescription('Gasta tu XP acumulada para obtener bendiciones temporales y cosméticos exclusivos.');

        const opcionesMenu = [];

        // 1. Objetos Especiales Estáticos
        tiendaEmbed.addFields(
            { name: '⚡ Rol XP X2 (3,000 XP)', value: 'Duplica tu XP ganada por 1 día.' },
            { name: '👁️ Canales Ocultos (5,000 XP)', value: 'Acceso a canales ocultos por 1 día.' },
            { name: '🎁 Caja de Regalo de Zeus (2,000 XP)', value: '¡Probá tu suerte! Caja misteriosa de Zeus.' }
        );

        opcionesMenu.push(
            { label: 'Rol XP X2 (3,000 XP)', description: 'Duplica tu XP ganada por 1 día', value: 'comprar_x2', emoji: '⚡' },
            { label: 'Canales Ocultos (5,000 XP)', description: 'Acceso a canales ocultos por 1 día', value: 'comprar_ocultos', emoji: '👁️' },
            { label: 'Caja de Regalo (2,000 XP)', description: 'Caja misteriosa de Zeus', value: 'comprar_caja', emoji: '🎁' }
        );

        // 2. Fondos de MongoDB
        fondosTienda.forEach(f => {
            tiendaEmbed.addFields({
                name: `🖼️ Fondo: ${f.nombreId} (${f.precio} XP)`,
                value: `Nivel Mínimo: ${f.nivelMinimo ?? 'Ninguno'}`
            });
            opcionesMenu.push({
                label: `Fondo: ${f.nombreId} (${f.precio} XP)`,
                description: `Req. Nivel ${f.nivelMinimo ?? 1}`,
                value: `comprar_bg_${f.nombreId}`,
                emoji: '🖼️'
            });
        });

        // 3. Fuentes de MongoDB
        fuentesTienda.forEach(fu => {
            tiendaEmbed.addFields({
                name: `🔤 Fuente: ${fu.nombreId} (${fu.precio} XP)`,
                value: `Nivel Mínimo: ${fu.nivelMinimo ?? 'Ninguno'}`
            });
            opcionesMenu.push({
                label: `Fuente: ${fu.nombreId} (${fu.precio} XP)`,
                description: `Req. Nivel ${fu.nivelMinimo ?? 1}`,
                value: `comprar_font_${fu.nombreId}`,
                emoji: '🔤'
            });
        });

        // 4. Packs de MongoDB
        packsTienda.forEach(p => {
            tiendaEmbed.addFields({
                name: `📦 Pack: ${p.nombreId} (${p.precio} XP)`,
                value: `Nivel Mínimo: ${p.nivelMinimo ?? 'Ninguno'}`
            });
            opcionesMenu.push({
                label: `Pack: ${p.nombreId} (${p.precio} XP)`,
                description: `Req. Nivel ${p.nivelMinimo ?? 1}`,
                value: `comprar_pack_${p.nombreId}`,
                emoji: '📦'
            });
        });

        const menuSelec = new StringSelectMenuBuilder()
            .setCustomId('tienda_menu')
            .setPlaceholder('Elegí un producto para comprar...')
            .addOptions(opcionesMenu);

        const fila = new ActionRowBuilder().addComponents(menuSelec);
        await interaction.editReply({ embeds: [tiendaEmbed], components: [fila] });
        return;
    }

    // /setfont
    if (commandName === 'setfont') {
        if (interaction.user.id !== PEPO_ID) {
            return await interaction.reply({ content: '❌ Solo Pepo.', ephemeral: true });
        }
        await interaction.deferReply({ ephemeral: true });

        try {
            const nombreId = interaction.options.getString('nombre_id').toLowerCase();
            const archivo = interaction.options.getAttachment('archivo');
            const precio = interaction.options.getInteger('precio');
            const nivel = interaction.options.getInteger('nivel');
            const usuarioEspecial = interaction.options.getUser('usuario');

            if (!archivo.name.endsWith('.ttf') && !archivo.name.endsWith('.otf')) {
                return await interaction.editReply('❌ Puchica maje, solo podés subir archivos de fuente .ttf o .otf');
            }

            const response = await fetch(archivo.url);
            const buffer = Buffer.from(await response.arrayBuffer());
            GlobalFonts.register(buffer, nombreId);

            await Font.findOneAndUpdate(
                { guildId: interaction.guild.id, nombreId },
                {
                    fontUrl: archivo.url,
                    precio: precio !== null ? precio : null,
                    nivelMinimo: nivel !== null ? nivel : null
                },
                { upsert: true, new: true }
            );

            if (usuarioEspecial) {
                let userXpData = await UserXP.findOne({ userId: usuarioEspecial.id, guildId: interaction.guild.id });
                if (!userXpData) userXpData = new UserXP({ userId: usuarioEspecial.id, guildId: interaction.guild.id });
                if (!userXpData.fuentesCompradas) userXpData.fuentesCompradas = [];
                if (!userXpData.fuentesCompradas.includes(nombreId)) userXpData.fuentesCompradas.push(nombreId);
                userXpData.fuenteEquipada = nombreId;
                await userXpData.save();

                return await interaction.editReply(`🎁 ¡Fuente **${nombreId}** instalada, regalada y equipada a <@${usuarioEspecial.id}>!`);
            }

            await interaction.editReply(`✅ ¡Fuente **${nombreId}** registrada con éxito en Canvas y cargada al sistema!`);
        } catch (err) {
            console.error("Error en /setfont:", err);
            await interaction.editReply(`❌ Puchica maje, dio un error al registrar la fuente: \`${err.message}\``);
        }
        return;
    }

    // /setpack
    if (commandName === 'setpack') {
        if (interaction.user.id !== PEPO_ID) {
            return await interaction.reply({ content: '❌ Solo Pepo.', ephemeral: true });
        }
        await interaction.deferReply({ ephemeral: true });

        try {
            const nombrePack = interaction.options.getString('nombre_pack').toLowerCase();
            const fondoId = interaction.options.getString('fondo_id').toLowerCase();
            const fuenteId = interaction.options.getString('fuente_id').toLowerCase();
            const precio = interaction.options.getInteger('precio');
            const nivel = interaction.options.getInteger('nivel');
            const usuarioEspecial = interaction.options.getUser('usuario');

            const fondoExiste = await Background.findOne({ guildId: interaction.guild.id, nombreId: fondoId });
            const fuenteExiste = await Font.findOne({ guildId: interaction.guild.id, nombreId: fuenteId });

            if (!fondoExiste || !fuenteExiste) {
                return await interaction.editReply(`❌ El fondo \`${fondoId}\` o la fuente \`${fuenteId}\` no existen.`);
            }

            await Pack.findOneAndUpdate(
                { guildId: interaction.guild.id, nombreId: nombrePack },
                { fondoNombreId: fondoId, fuenteNombreId: fuenteId, precio: precio ?? null, nivelMinimo: nivel ?? null },
                { upsert: true, new: true }
            );

            if (usuarioEspecial) {
                let userXpData = await UserXP.findOne({ userId: usuarioEspecial.id, guildId: interaction.guild.id });
                if (!userXpData) userXpData = new UserXP({ userId: usuarioEspecial.id, guildId: interaction.guild.id });

                if (!userXpData.cartelesComprados) userXpData.cartelesComprados = [];
                if (!userXpData.fuentesCompradas) userXpData.fuentesCompradas = [];
                if (!userXpData.packsComprados) userXpData.packsComprados = [];

                if (!userXpData.cartelesComprados.includes(fondoId)) userXpData.cartelesComprados.push(fondoId);
                if (!userXpData.fuentesCompradas.includes(fuenteId)) userXpData.fuentesCompradas.push(fuenteId);
                if (!userXpData.packsComprados.includes(nombrePack)) userXpData.packsComprados.push(nombrePack);

                userXpData.cartelEquipado = fondoId;
                userXpData.fuenteEquipada = fuenteId;
                await userXpData.save();

                return await interaction.editReply(`🎁 ¡Pack Combo **${nombrePack}** regalado y equipado a <@${usuarioEspecial.id}>!`);
            }

            await interaction.editReply(`📦 ¡Pack Combo **${nombrePack}** creado y añadido a la tienda con éxito!`);
        } catch (err) {
            console.error("Error en /setpack:", err);
            await interaction.editReply(`❌ Error en /setpack: \`${err.message}\``);
        }
        return;
    }
});

// --- MANEJADOR DE SELECCIONES EN LA TIENDA ---
client.on('interactionCreate', async interaction => {
    if (!interaction.isStringSelectMenu()) return;

    const { customId, values } = interaction;

    if (customId === 'tienda_menu') {
        await interaction.deferReply({ ephemeral: true });
        const opcion = values[0];
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        try {
            let userXpData = await UserXP.findOne({ userId, guildId });
            if (!userXpData) userXpData = new UserXP({ userId, guildId, xp: 0, level: 1 });

            const ahora = Date.now();
            const xpTotalActual = obtenerXpTotal(userXpData);

            // 1. ROL XP X2
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

            // 2. CANALES OCULTOS
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

            // 3. CAJA MISTERIOSA DE ZEUS
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

                return await interaction.editReply(`🎁 **¡Abriste la Caja de Regalo de Zeus!**\n\nZeus te ha bendecido con **+${xpGanadaAzar} XP** al azar 🔥\nQuedaste en **Nivel ${userXpData.level}** (${userXpData.xp}/${(userXpData.level + 1) * 100} XP).`);
            }

            // 4. FONDOS DE MONGO
            if (opcion.startsWith('comprar_bg_')) {
                const bgId = opcion.replace('comprar_bg_', '');
                const bgObj = await Background.findOne({ guildId, nombreId: bgId });

                if (!bgObj) return await interaction.editReply('❌ El fondo ya no existe.');
                if (bgObj.nivelMinimo && userXpData.level < bgObj.nivelMinimo) {
                    return await interaction.editReply(`❌ Requerís **Nivel ${bgObj.nivelMinimo}** para comprar este fondo.`);
                }
                if (xpTotalActual < bgObj.precio) {
                    return await interaction.editReply(`❌ Necesitás **${bgObj.precio} XP** acumulada.`);
                }

                recalcularProgreso(userXpData, xpTotalActual - bgObj.precio);
                if (!userXpData.cartelesComprados) userXpData.cartelesComprados = [];
                if (!userXpData.cartelesComprados.includes(bgId)) userXpData.cartelesComprados.push(bgId);
                userXpData.cartelEquipado = bgId;
                await userXpData.save();

                return await interaction.editReply(`🖼️ ¡Compraste y equipaste el fondo **${bgId}** con éxito!`);
            }

            // 5. FUENTES DE MONGO
            if (opcion.startsWith('comprar_font_')) {
                const fontId = opcion.replace('comprar_font_', '');
                const fontObj = await Font.findOne({ guildId, nombreId: fontId });

                if (!fontObj) return await interaction.editReply('❌ La fuente ya no existe.');
                if (fontObj.nivelMinimo && userXpData.level < fontObj.nivelMinimo) {
                    return await interaction.editReply(`❌ Requerís **Nivel ${fontObj.nivelMinimo}** para comprar esta fuente.`);
                }
                if (xpTotalActual < fontObj.precio) {
                    return await interaction.editReply(`❌ Necesitás **${fontObj.precio} XP** acumulada.`);
                }

                recalcularProgreso(userXpData, xpTotalActual - fontObj.precio);
                if (!userXpData.fuentesCompradas) userXpData.fuentesCompradas = [];
                if (!userXpData.fuentesCompradas.includes(fontId)) userXpData.fuentesCompradas.push(fontId);
                userXpData.fuenteEquipada = fontId;
                await userXpData.save();

                return await interaction.editReply(`🔤 ¡Compraste y equipaste la fuente **${fontId}** con éxito!`);
            }

            // 6. PACKS DE MONGO
            if (opcion.startsWith('comprar_pack_')) {
                const packId = opcion.replace('comprar_pack_', '');
                const packObj = await Pack.findOne({ guildId, nombreId: packId });

                if (!packObj) return await interaction.editReply('❌ El pack ya no existe.');
                if (packObj.nivelMinimo && userXpData.level < packObj.nivelMinimo) {
                    return await interaction.editReply(`❌ Requerís **Nivel ${packObj.nivelMinimo}** para comprar este pack.`);
                }
                if (xpTotalActual < packObj.precio) {
                    return await interaction.editReply(`❌ Necesitás **${packObj.precio} XP** acumulada.`);
                }

                recalcularProgreso(userXpData, xpTotalActual - packObj.precio);
                if (!userXpData.cartelesComprados) userXpData.cartelesComprados = [];
                if (!userXpData.fuentesCompradas) userXpData.fuentesCompradas = [];
                if (!userXpData.packsComprados) userXpData.packsComprados = [];

                if (!userXpData.cartelesComprados.includes(packObj.fondoNombreId)) userXpData.cartelesComprados.push(packObj.fondoNombreId);
                if (!userXpData.fuentesCompradas.includes(packObj.fuenteNombreId)) userXpData.fuentesCompradas.push(packObj.fuenteNombreId);
                if (!userXpData.packsComprados.includes(packId)) userXpData.packsComprados.push(packId);

                userXpData.cartelEquipado = packObj.fondoNombreId;
                userXpData.fuenteEquipada = packObj.fuenteNombreId;
                await userXpData.save();

                return await interaction.editReply(`📦 ¡Compraste y equipaste el pack combo **${packId}** con éxito!`);
            }

        } catch (err) {
            console.error("Clavo en la tienda:", err);
            return await interaction.editReply('❌ Puchica, algo trono feo al intentar hacer la compra.');
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
        

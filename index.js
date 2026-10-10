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
require('dotenv').config();

const UserXP = require('./UserXP.js'); //[span_12](start_span)[span_12](end_span)
const Background = require('./Background.js'); //[span_13](start_span)[span_13](end_span)

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
}); //[span_14](start_span)[span_14](end_span)

// TU ID EXCLUSIVA Y ROLES[span_15](start_span)[span_15](end_span)
const PEPO_ID = '1259006426978713620'; //[span_16](start_span)[span_16](end_span)
const ROL_XP_4 = '123456789012345678'; //[span_17](start_span)[span_17](end_span)
const ROL_XP_X2 = '1545950431908470865'; //[span_18](start_span)[span_18](end_span)
const ROL_OCULTO = '1545963099788410950'; //[span_19](start_span)[span_19](end_span)

const nivelesRoles = [
    { min: 1000, max: 99999, id: '15458906863863480' },
    { min: 850, max: 999, id: '154588858426703932' },
    { min: 800, max: 849, id: '1545888736145683201' },
    { min: 750, max: 799, id: '1545884446151663635' },
    { min: 700, max: 749, id: '15458826210970348' },
    { min: 650, max: 699, id: '154588769677657916' },
    { min: 600, max: 649, id: '154588658270654770' },
    { min: 550, max: 599, id: '154588642571805085' },
    { min: 500, max: 549, id: '15458862998518194' },
    { min: 450, max: 499, id: '154588612375666938' },
    { min: 400, max: 449, id: '154588580179085539' },
    { min: 350, max: 399, id: '154588426424059043' },
    { min: 300, max: 349, id: '154588259554207884' },
    { min: 250, max: 299, id: '1545884764438011985' },
    { min: 200, max: 249, id: '1545884525395976263' },
    { min: 150, max: 199, id: '1545884626132228217' },
    { min: 125, max: 149, id: '1545883826121322817' },
    { min: 100, max: 124, id: '154588300109091665' },
    { min: 80, max: 99, id: '1545881490582167112' },
    { min: 70, max: 79, id: '1545881103158747105' },
    { min: 60, max: 69, id: '1359366160758300738' },
    { min: 50, max: 59, id: '135936609626280566' },
    { min: 40, max: 49, id: '1359366024806168516' },
    { min: 30, max: 39, id: '135936595509722112' },
    { min: 20, max: 29, id: '1359365884605064510' },
    { min: 15, max: 19, id: '1359365813416403105' },
    { min: 10, max: 14, id: '1359365706667823104' },
    { min: 5, max: 9, id: '135936530310644820' },
    { min: 1, max: 4, id: '135936623938260582' },
    { min: 0, max: 0, id: '1359363942727815260' }
]; //[span_20](start_span)[span_20](end_span)

const rolexTop3 = [ '1541902325784912064', '154190218885412405', '154180...' ]; //[span_21](start_span)[span_21](end_span)

mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI)
    .then(() => console.log('Base de datos conectada al 100 > :v'))
    .catch(err => console.error('Puchica fallo la base de datos:', err)); //[span_22](start_span)[span_22](end_span)

// --- DEFINICIÓN DE COMANDOS SLASH ---
const dataAddXp = {
    name: 'añadir-xp',
    description: 'Añade XP a un maje.',
    options: [
        { name: 'usuario', type: ApplicationCommandOptionType.User, description: 'Usuario', required: true },
        { name: 'cant', type: ApplicationCommandOptionType.Integer, description: 'Cantidad de XP', required: true }
    ]
}; //[span_23](start_span)[span_23](end_span)

const dataQuitarXp = {
    name: 'quitar-xp',
    description: 'Quita XP a un maje.',
    options: [
        { name: 'usuario', type: ApplicationCommandOptionType.User, description: 'Usuario', required: true },
        { name: 'cant', type: ApplicationCommandOptionType.Integer, description: 'Cantidad', required: true }
    ]
}; //[span_24](start_span)[span_24](end_span)

const dataVerXp = {
    name: 'xp',
    description: 'Muestra tu nivel y XP actual.',
    options: [
        { name: 'usuario', type: ApplicationCommandOptionType.User, description: 'Usuario opcional', required: false }
    ]
}; //[span_25](start_span)[span_25](end_span)

const dataTop = { name: 'top', description: 'Muestra el Top 10 de majes con más XP' }; //[span_26](start_span)[span_26](end_span)
const dataComprar = { name: 'comprar', description: 'Abre la tienda de Zeus & semana1' }; //[span_27](start_span)[span_27](end_span)
const dataPerfil = { name: 'perfil', description: 'Abre tu armario de fondos y fuentes' }; //[span_28](start_span)[span_28](end_span)

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
}; //[span_29](start_span)[span_29](end_span)

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
}; //[span_30](start_span)[span_30](end_span)

const dataDelBg = {
    name: 'delbg',
    description: 'Borra un fondo de MongoDB (Exclusivo Pepo)',
    options: [
        { name: 'nombre_id', type: ApplicationCommandOptionType.String, description: 'Nombre ID', required: true }
    ]
}; //[span_31](start_span)[span_31](end_span)

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
}); //[span_32](start_span)[span_32](end_span)

// --- RENDERIZADOR CANVAS (FUENTES LIMPIAS Y COLORES DINÁMICOS) ---
async function generarTarjetaCritica({ dibujoUrl, artistaNombre, artistaAvatarUrl, loBueno, loMalo, resumen, fondoUrl, positivoPct, stats, fuenteNombre }) {
    const width = 1000;
    const height = 600;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    const fontFamily = fuenteNombre ? `"${fuenteNombre}", sans-serif` : 'sans-serif'; // Soporte de fuente dinámica
    const posFinal = Math.max(0, Math.min(100, positivoPct));
    const negativoPct = Math.max(0, Math.min(100, 100 - posFinal));

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // 1. Fondo completo
    if (fondoUrl) {
        try {
            const resBg = await fetch(fondoUrl);
            const bufBg = Buffer.from(await resBg.arrayBuffer());
            const fondoImg = await loadImage(bufBg);
            ctx.drawImage(fondoImg, 0, 0, width, height);
        } catch (e) {
            ctx.fillStyle = '#121216';
            ctx.fillRect(0, 0, width, height);
        }
    } else {
        ctx.fillStyle = '#121216';
        ctx.fillRect(0, 0, width, height);
    }

    // Capa translúcida general (0.45 exacto)[span_33](start_span)[span_33](end_span)
    ctx.fillStyle = 'rgba(18, 18, 24, 0.45)';
    ctx.roundRect(20, 20, width - 40, height - 40, 20);
    ctx.fill();

    // A. DIBUJO DEL ARTISTA
    try {
        const resDibujo = await fetch(dibujoUrl);
        const bufferDibujo = Buffer.from(await resDibujo.arrayBuffer());
        const dibujoImg = await loadImage(bufferDibujo);

        ctx.save();
        ctx.beginPath();
        ctx.roundRect(40, 40, 400, 370, 15);
        ctx.clip();
        ctx.drawImage(dibujoImg, 40, 40, 400, 370);
        ctx.restore();
    } catch (err) {
        console.error("Error al cargar dibujo:", err);
    }

    // B. BARRAS DE PORCENTAJE
    const barX = 40, barY = 430, barWidth = 400, barHeight = 20;

    ctx.font = `bold 15px ${fontFamily}`;
    ctx.fillStyle = '#4CAF50';
    ctx.fillText(`🟢 Positivo: ${posFinal}%`, barX, barY);

    ctx.fillStyle = '#1E232A';
    ctx.roundRect(barX, barY + 6, barWidth, barHeight, 8);
    ctx.fill();

    if (posFinal > 0) {
        const wVerde = (barWidth * posFinal) / 100;
        ctx.fillStyle = '#4CAF50';
        ctx.roundRect(barX, barY + 6, wVerde, barHeight, 8);
        ctx.fill();
    }

    ctx.fillStyle = '#FF5252';
    ctx.fillText(`🔴 Negativo: ${negativoPct}%`, barX, barY + 54);

    ctx.fillStyle = '#1E232A';
    ctx.roundRect(barX, barY + 60, barWidth, barHeight, 8);
    ctx.fill();

    if (negativoPct > 0) {
        const wRojo = (barWidth * negativoPct) / 100;
        ctx.fillStyle = '#FF5252';
        ctx.roundRect(barX, barY + 60, wRojo, barHeight, 8);
        ctx.fill();
    }

    // C. AVATAR + NOMBRE
    ctx.fillStyle = '#FFD700';
    ctx.font = `bold 22px ${fontFamily}`;
    ctx.fillText(`🪶 @${artistaNombre}`, 470, 75);

    try {
        if (artistaAvatarUrl) {
            const resAvatar = await fetch(artistaAvatarUrl);
            const bufAvatar = Buffer.from(await resAvatar.arrayBuffer());
            const avatarImg = await loadImage(bufAvatar);

            ctx.save();
            ctx.beginPath();
            ctx.arc(920, 70, 35, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(avatarImg, 885, 35, 70, 70);
            ctx.restore();
        }
    } catch (e) {
        console.error("Error avatar:", e);
    }

    ctx.strokeStyle = '#3A3A4A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(470, 115);
    ctx.lineTo(950, 115);
    ctx.stroke();

    // D. TEXTO RESUMIDO
    const wrapText = (context, label, text, colorLabel, x, startY, maxWidth, lineHeight) => {
        context.font = `bold 16px ${fontFamily}`;
        context.fillStyle = colorLabel;
        context.fillText(label, x, startY);

        context.font = `15px ${fontFamily}`;
        context.fillStyle = '#E2E2E8';

        const words = text.split(' ');
        let line = '';
        let currentY = startY + 20;

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
        return currentY + 25;
    };

    let nextY = wrapText(ctx, '🟢 LO FUERTE:', loBueno, '#4CAF50', 470, nextY = 145, 480, 20);
    nextY = wrapText(ctx, '🔴 EL FRENO:', loMalo, '#FF5252', 470, nextY, 480, 20);
    nextY = wrapText(ctx, '📋 VEREDICTO:', resumen, '#FFB700', 470, nextY, 480, 20);

    // E. BARRAS VERTICALES
    const graphYBase = 530;
    const graphMaxHeight = 100;
    const startX = 480;
    const barGap = 98;
    const colWidth = 28;

    ctx.fillStyle = '#FFD700';
    ctx.font = `bold 16px ${fontFamily}`;
    ctx.fillText('📊 ANÁLISIS DE HABILIDADES:', 470, Math.max(nextY + 10, 330));

    const obtenerColorRango = (porcentaje) => {
        if (porcentaje < 70) return '#1B5E20';
        if (porcentaje < 80) return '#00BCD4';
        if (porcentaje < 90) return '#003DFF';
        return '#FFFFFF';
    };

    stats.forEach((item, index) => {
        const x = startX + (index * barGap);
        const val = Math.max(0, Math.min(100, item.val));
        const currentBarHeight = (graphMaxHeight * val) / 100;
        const colorBarra = obtenerColorRango(val);

        ctx.fillStyle = '#1E232A';
        ctx.beginPath();
        ctx.roundRect(x, graphYBase - graphMaxHeight, colWidth, graphMaxHeight, 8);
        ctx.fill();

        if (val > 0) {
            ctx.fillStyle = colorBarra;
            ctx.beginPath();
            ctx.roundRect(x, graphYBase - currentBarHeight, colWidth, currentBarHeight, 8);
            ctx.fill();
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold 12px ${fontFamily}`;
        ctx.fillText(`${val}%`, x - 2, graphYBase - (val > 0 ? currentBarHeight : 0) - 8);

        ctx.fillStyle = '#AAAAAA';
        ctx.font = `bold 11px ${fontFamily}`;
        ctx.fillText(item.nombre, x - 10, graphYBase + 20);
    });

    return canvas.toBuffer('image/png');
} //[span_34](start_span)[span_34](end_span)[span_35](start_span)[span_35](end_span)[span_36](start_span)[span_36](end_span)[span_37](start_span)[span_37](end_span)

// --- MANEJADOR DE INTERACCIONES ---
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

            return await interaction.editReply(`⭐ <@${target.id}> tiene **${xp} XP** y está en el **Nivel ${level}**.`);
        } catch (err) {
            console.error("Error en /xp:", err);
            if (interaction.deferred) {
                return await interaction.editReply(`❌ Puchica maje, dio error con la BD: \`${err.message}\``);
            }
        }
        return;
    }

    // /top
    if (commandName === 'top') {
        try {
            await interaction.deferReply();
            const topUsers = await UserXP.find({ guildId: interaction.guild.id }).sort({ xp: -1 }).limit(10);
            if (!topUsers || topUsers.length === 0) {
                return await interaction.editReply('❌ No hay registros de XP todavía en este servidor.');
            }

            let desc = topUsers.map((u, i) => `**#${i + 1}** <@${u.userId}> - Nivel ${u.level} (${u.xp} XP)`).join('\n');
            return await interaction.editReply(`🏆 **TOP 10 DE MAJES CON MÁS XP**:\n\n${desc}`);
        } catch (err) {
            console.error("Error en /top:", err);
            if (interaction.deferred) {
                return await interaction.editReply(`❌ Error al cargar el top: \`${err.message}\``);
            }
        }
        return;
    }

    // /añadir-xp (EXCLUSIVO PEPO)
    if (commandName === 'añadir-xp') {
        try {
            if (interaction.user.id !== PEPO_ID) {
                return await interaction.reply({ content: '❌ Solo Pepo.', ephemeral: true });
            }
            await interaction.deferReply({ ephemeral: true });

            const target = interaction.options.getUser('usuario');
            const cant = interaction.options.getInteger('cant');

            let userXp = await UserXP.findOne({ userId: target.id, guildId: interaction.guild.id });
            if (!userXp) {
                userXp = new UserXP({ userId: target.id, guildId: interaction.guild.id, xp: 0, level: 1 });
            }

            userXp.xp += cant;
            await userXp.save();

            return await interaction.editReply(`✅ Se le añadieron **${cant} XP** a <@${target.id}>.`);
        } catch (err) {
            console.error("Error en añadir-xp:", err);
            if (interaction.deferred) {
                return await interaction.editReply(`❌ Error: \`${err.message}\``);
            }
        }
        return;
    }

    // /quitar-xp (EXCLUSIVO PEPO)
    if (commandName === 'quitar-xp') {
        try {
            if (interaction.user.id !== PEPO_ID) {
                return await interaction.reply({ content: '❌ Solo Pepo.', ephemeral: true });
            }
            await interaction.deferReply({ ephemeral: true });

            const target = interaction.options.getUser('usuario');
            const cant = interaction.options.getInteger('cant');

            let userXp = await UserXP.findOne({ userId: target.id, guildId: interaction.guild.id });
            if (!userXp) return await interaction.editReply('❌ El usuario no tiene registros.');

            userXp.xp = Math.max(0, userXp.xp - cant);
            await userXp.save();

            return await interaction.editReply(`✅ Se le quitaron **${cant} XP** a <@${target.id}>.`);
        } catch (err) {
            console.error("Error en quitar-xp:", err);
            if (interaction.deferred) {
                return await interaction.editReply(`❌ Error: \`${err.message}\``);
            }
        }
        return;
                }

    // /comprar
    if (commandName === 'comprar') {
        await interaction.deferReply();
        const fondosTienda = await Background.find({ guildId: interaction.guild.id, precio: { $ne: null } });

        const tiendaEmbed = new EmbedBuilder()
            .setColor('#00ffaa')
            .setTitle('🎨 Tienda de Zeus & #semanal')
            .setDescription('Gasta tu XP acumulada para obtener ventajas y cosméticos exclusivos.');

        const opcionesMenu = [];
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

        if (opcionesMenu.length === 0) {
            return await interaction.editReply('❌ No hay ítems en la tienda todavía.');
        }

        const menuSelec = new StringSelectMenuBuilder()
            .setCustomId('tienda_menu')
            .setPlaceholder('Elegí un producto para comprar...')
            .addOptions(opcionesMenu);

        const fila = new ActionRowBuilder().addComponents(menuSelec);
        await interaction.editReply({ embeds: [tiendaEmbed], components: [fila] });
        return;
    }

    // /perfil
    if (commandName === 'perfil') {
        await interaction.deferReply({ ephemeral: true });
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        let userXpData = await UserXP.findOne({ userId, guildId });
        const nivelUsuario = userXpData ? userXpData.level : 1;
        const compradosOAsignados = userXpData?.cartelesComprados || [];

        const desbloqueadosPorNivel = await Background.find({
            guildId,
            precio: null,
            nivelMinimo: { $ne: null, $lte: nivelUsuario }
        });

        const predeterminados = await Background.find({
            guildId,
            precio: null,
            nivelMinimo: null
        });

        const nombresGratis = [...desbloqueadosPorNivel, ...predeterminados].map(b => b.nombreId);
        const todosMisFondos = [...new Set([...nombresGratis, ...compradosOAsignados])];

        if (todosMisFondos.length === 0) {
            return await interaction.editReply('Puchica maje, aún no tenés fondos disponibles.');
        }

        const perfilEmbed = new EmbedBuilder()
            .setColor('#0b59b6')
            .setTitle(`🎨 Armario de Cosméticos de ${interaction.user.username}`)
            .setDescription(`Elegí cuál de tus fondos guardados querés equiparte en tus fichas.`)
            .addFields({ name: '🖼️ Fondo Equipado Actual:', value: `\`${userXpData?.cartelEquipado || 'Ninguno'}\`` })
            .setFooter({ text: 'Zeus Armario', iconURL: client.user.displayAvatarURL() });

        const opcionesCarteles = todosMisFondos.map(c => ({
            label: `Fondo: ${c}`,
            value: `equipar_cartel_${c}`,
            emoji: '🖼️'
        }));

        const menuCarteles = new StringSelectMenuBuilder()
            .setCustomId('equipar_cartel_menu')
            .setPlaceholder('Elegí un fondo para equipar...')
            .addOptions(opcionesCarteles);

        const fila = new ActionRowBuilder().addComponents(menuCarteles);
        await interaction.editReply({ embeds: [perfilEmbed], components: [fila] });
        return;
    }

    // /setbg (EXCLUSIVO PEPO)
    if (commandName === 'setbg') {
        if (interaction.user.id !== PEPO_ID) {
            return await interaction.reply({ content: '❌ Solo Pepo puede subir fondos.', ephemeral: true });
        }
        await interaction.deferReply({ ephemeral: true });

        try {
            const nombreId = interaction.options.getString('nombre_id').toLowerCase();
            const imagen = interaction.options.getAttachment('imagen');
            const precio = interaction.options.getInteger('precio');
            const nivel = interaction.options.getInteger('nivel');
            const usuarioEspecial = interaction.options.getUser('usuario');

            await Background.findOneAndUpdate(
                { guildId: interaction.guild.id, nombreId },
                {
                    imageUrl: imagen.url,
                    precio: precio !== null ? precio : null,
                    nivelMinimo: nivel !== null ? nivel : null
                },
                { upsert: true, new: true }
            );

            if (usuarioEspecial) {
                let userXpData = await UserXP.findOne({ userId: usuarioEspecial.id, guildId: interaction.guild.id });
                if (!userXpData) userXpData = new UserXP({ userId: usuarioEspecial.id, guildId: interaction.guild.id });
                if (!userXpData.cartelesComprados) userXpData.cartelesComprados = [];
                if (!userXpData.cartelesComprados.includes(nombreId)) userXpData.cartelesComprados.push(nombreId);
                userXpData.cartelEquipado = nombreId;
                await userXpData.save();
                return await interaction.editReply(`🎁 ¡Fondo **${nombreId}** regalado y equipado a <@${usuarioEspecial.id}>!`);
            }

            let modoTxt = '';
            if (precio !== null && nivel !== null) {
                modoTxt = `🛒 **Tienda:** Cuesta **${precio} XP** y requiere **Nivel ${nivel}**`;
            } else if (precio !== null) {
                modoTxt = `🛒 **Tienda:** Cuesta **${precio} XP** para quien sea`;
            } else if (nivel !== null) {
                modoTxt = `🎁 **Recompensa Gratis:** Se desbloquea al alcanzar **Nivel ${nivel}**`;
            } else {
                modoTxt = `🔓 **Predeterminado:** Gratis y disponible para todos`;
            }

            await interaction.editReply(`✅ ¡Fondo **${nombreId}** guardado nítido!\n${modoTxt}`);
        } catch (err) {
            console.error("Clavo en /setbg:", err);
            await interaction.editReply(`❌ Puchica maje, dio un error al guardar el fondo: \`${err.message}\``);
        }
        return;
    }

    // /delbg (EXCLUSIVO PEPO)
    if (commandName === 'delbg') {
        if (interaction.user.id !== PEPO_ID) {
            return await interaction.reply({ content: '❌ Solo Pepo.', ephemeral: true });
        }
        await interaction.deferReply({ ephemeral: true });

        try {
            const nombreId = interaction.options.getString('nombre_id').toLowerCase();
            const borrado = await Background.findOneAndDelete({ guildId: interaction.guild.id, nombreId });

            if (!borrado) {
                return await interaction.editReply(`❌ No se encontró el fondo **${nombreId}**.`);
            }
            await interaction.editReply(`🗑️ ¡Fondo **${nombreId}** borrado con éxito!`);
        } catch (err) {
            console.error("Error en /delbg:", err);
            await interaction.editReply(`❌ Puchica maje, dio un error al borrar el fondo.`);
        }
        return;
    }

    // /setfont (EXCLUSIVO PEPO)
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
                return await interaction.editReply('❌ Puchica maje, solo podés subir archivos de fuente `.ttf` o `.otf`.');
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
                if (!userXpData) userXpData = new UserXP({ userId: usuarioEspecial.id, guildId: interaction.guild.id, xp: 0, level: 1 });
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

    // /setpack (EXCLUSIVO PEPO)
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
                return await interaction.editReply(`❌ El fondo \`${fondoId}\` o la fuente \`${fuenteId}\` no existen. Súbelos primero.`);
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
            await interaction.editReply(`❌ Error en /setpack: \`${err.message}\``);
        }
        return;
    }

    // /critica (EXCLUSIVO PEPO)
    if (commandName === 'critica') {
        if (interaction.user.id !== PEPO_ID) {
            return await interaction.reply({ content: '❌ Solo Pepo.', ephemeral: true });
        }
        await interaction.deferReply();

        try {
            const artista = interaction.options.getUser('artista');
            const foto = interaction.options.getAttachment('foto');
            const loBueno = interaction.options.getString('lo_bueno');
            const loMalo = interaction.options.getString('lo_malo');
            const resumen = interaction.options.getString('resumen');
            const positivoPct = interaction.options.getInteger('positivo') ?? 70;

            const stats = [
                { nombre: 'Lineart', val: interaction.options.getInteger('lineart') ?? 80 },
                { nombre: 'Creatividad', val: interaction.options.getInteger('creatividad') ?? 85 },
                { nombre: 'Detalles', val: interaction.options.getInteger('detalles') ?? 75 },
                { nombre: 'Paleta', val: interaction.options.getInteger('paleta') ?? 90 },
                { nombre: 'Pinceles', val: interaction.options.getInteger('pinceles') ?? 70 }
            ];

            let datosArtista = await UserXP.findOne({ userId: artista.id, guildId: interaction.guild.id });
            const nombreCartel = datosArtista?.cartelEquipado;
            const fuenteNombre = datosArtista?.fuenteEquipada;

            let urlFondoUsar = null;
            if (nombreCartel) {
                const bgObj = await Background.findOne({ guildId: interaction.guild.id, nombreId: nombreCartel });
                if (bgObj) urlFondoUsar = bgObj.imageUrl;
            }

            const bufferFicha = await generarTarjetaCritica({
                dibujoUrl: foto.url,
                artistaNombre: artista.username,
                artistaAvatarUrl: artista.displayAvatarURL({ extension: 'png', size: 256 }),
                loBueno,
                loMalo,
                resumen,
                fondoUrl: urlFondoUsar,
                positivoPct,
                stats,
                fuenteNombre
            });

            const attachment = new AttachmentBuilder(bufferFicha, { name: `critica_${artista.username}.png` });

            await interaction.editReply({
                content: `🎨 **EVALUACIÓN OFICIAL DE #SEMANAL PARA** <@${artista.id}>`,
                files: [attachment]
            });
        } catch (error) {
            console.error('Error en /critica:', error);
            await interaction.editReply('Puchica maje, falló el renderizado.');
        }
        return;
    }
});

// --- B. MENÚS DESPLEGABLES ---
client.on('interactionCreate', async interaction => {
    if (!interaction.isStringSelectMenu()) return;

    const { customId, values } = interaction;

    if (customId === 'tienda_menu') {
        await interaction.deferReply({ ephemeral: true });
        const opcion = values[0];
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        let userXpData = await UserXP.findOne({ userId, guildId });
                if (!userXpData) userXpData = new UserXP({ userId, guildId });

        let xpTotalActual = userXpData.xp + (userXpData.level - 1) * 1000;

        if (opcion.startsWith('comprar_bg_')) {
            const nombreBg = opcion.replace('comprar_bg_', '');
            const bgData = await Background.findOne({ guildId, nombreId: nombreBg });

            if (!bgData) return await interaction.editReply('Puchica maje, ya no existe ese fondo.');
            if (bgData.nivelMinimo && userXpData.level < bgData.nivelMinimo) {
                return await interaction.editReply(`Necesitás ser al menos Nivel ${bgData.nivelMinimo} para comprar este fondo.`);
            }
            if (xpTotalActual < bgData.precio) {
                return await interaction.editReply('No te alcanza la XP acumulada maje.');
            }

            if (!userXpData.cartelesComprados) userXpData.cartelesComprados = [];
            if (userXpData.cartelesComprados.includes(nombreBg)) {
                userXpData.cartelEquipado = nombreBg;
                await userXpData.save();
                return await interaction.editReply('Ya tenías este fondo, ¡te lo equipé de un solo!');
            }

            userXpData.cartelesComprados.push(nombreBg);
            userXpData.cartelEquipado = nombreBg;
            await userXpData.save();

            return await interaction.editReply(`🔥 ¡Compraste y equipaste el fondo **${nombreBg}**!`);
        }
    }

    if (customId === 'equipar_cartel_menu') {
        await interaction.deferReply({ ephemeral: true });
        const seleccion = values[0];
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        let userXpData = await UserXP.findOne({ userId, guildId });
        if (!userXpData) {
            userXpData = new UserXP({ userId, guildId, xp: 0, level: 1 });
        }

        const itemElegido = seleccion.replace('equipar_cartel_', '');

        userXpData.cartelEquipado = itemElegido;
        await userXpData.save();

        return await interaction.editReply(`✅ ¡Nítido! Ahora tenés equipado el fondo **${itemElegido}**.`);
    }
});

client.login(process.env.TOKEN || process.env.DISCORD_TOKEN);

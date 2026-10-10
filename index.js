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

const dataGuitarXp = {
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
    description: 'Abre la tienda de Zeus para comprar cosméticos de #semanal'
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
        await client.application.commands.create(dataGuitarXp);
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

// --- FUNCIÓN CANVAS PARA LA FICHA ---
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

// --- MANEJADOR DE INTERACCIONES ---
client.on('interactionCreate', async (interaction) => {
    
    // A. COMANDOS DE XP BÁSICOS
    if (interaction.isChatInputCommand()) {
        const { commandName } = interaction;

        if (commandName === 'añadir-xp') {
            await interaction.deferReply();
            const targetUser = interaction.options.getUser('usuario');
            const cant = interaction.options.getInteger('cant');

            let userXp = await UserXP.findOne({ userId: targetUser.id, guildId: interaction.guild.id });
            if (!userXp) userXp = new UserXP({ userId: targetUser.id, guildId: interaction.guild.id, xp: 0, level: 1 });

            userXp.xp += cant;
            await userXp.save();

            return await interaction.editReply(`⚡ Se le añadieron **${cant} XP** a <@${targetUser.id}>. Nítido!`);
        }

        if (commandName === 'quitar-xp') {
            await interaction.deferReply();
            const targetUser = interaction.options.getUser('usuario');
            const cant = interaction.options.getInteger('cant');

            let userXp = await UserXP.findOne({ userId: targetUser.id, guildId: interaction.guild.id });
            if (!userXp) userXp = new UserXP({ userId: targetUser.id, guildId: interaction.guild.id, xp: 0, level: 1 });

            userXp.xp = Math.max(0, userXp.xp - cant);
            await userXp.save();

            return await interaction.editReply(`✂️ Se le quitaron **${cant} XP** a <@${targetUser.id}>.`);
        }

        if (commandName === 'xp') {
            await interaction.deferReply();
            const targetUser = interaction.options.getUser('usuario') || interaction.user;

            let userXp = await UserXP.findOne({ userId: targetUser.id, guildId: interaction.guild.id });
            const xp = userXp ? userXp.xp : 0;
            const lvl = userXp ? userXp.level : 1;

            return await interaction.editReply(`📊 **${targetUser.username}** tiene **${xp} XP** y es **Nivel ${lvl}**.`);
        }

        if (commandName === 'top') {
            await interaction.deferReply();
            const topUsers = await UserXP.find({ guildId: interaction.guild.id }).sort({ xp: -1 }).limit(10);

            if (!topUsers.length) return await interaction.editReply('Aún no hay datos de XP en este servidor.');

            let desc = topUsers.map((u, i) => `**#${i + 1}** <@${u.userId}> - **${u.xp} XP** (Nivel ${u.level})`).join('\n');
            const embed = new EmbedBuilder()
                .setTitle('🏆 Top 10 Majes con Más XP')
                .setColor('#FFD700')
                .setDescription(desc);

            return await interaction.editReply({ embeds: [embed] });
        }
    }

    // 1. ABRIR TIENDA
    if (interaction.isChatInputCommand() && interaction.commandName === 'comprar') {
        const tiendaEmbed = new EmbedBuilder()
            .setColor('#00ffaa')
            .setTitle('🛒 Tienda de Cosméticos de Zeus')
            .setDescription('Gasta tu XP acumulada para desbloquear carteles y fuentes personalizadas para `#semanal` 🔥')
            .addFields(
                { name: '🖼️ Cartel Neón (4,000 XP)', value: 'Desbloquea el marco neón para tus fichas.' },
                { name: '📜 Cartel Pergamino (6,000 XP)', value: 'Desbloquea el estilo antiguo/gótico.' },
                { name: '✍️ Fuente Gótica (2,500 XP)', value: 'Desbloquea la tipografía de estatus.' }
            )
            .setFooter({ text: 'Tienda Oficial - Zeus', iconURL: client.user.displayAvatarURL() });

        const menuSelec = new StringSelectMenuBuilder()
            .setCustomId('tienda_menu')
            .setPlaceholder('Elegí un producto para comprar...')
            .addOptions([
                { label: 'Cartel Neón (4,000 XP)', value: 'comprar_cartel_neon', emoji: '🖼️' },
                { label: 'Cartel Pergamino (6,000 XP)', value: 'comprar_cartel_pergamino', emoji: '📜' },
                { label: 'Fuente Gótica (2,500 XP)', value: 'comprar_fuente_gotica', emoji: '✍️' }
            ]);

        const fila = new ActionRowBuilder().addComponents(menuSelec);
        await interaction.reply({ embeds: [tiendaEmbed], components: [fila] });
        return;
    }

    // 2. COMPRAS DE LA TIENDA
    if (interaction.isStringSelectMenu() && interaction.customId === 'tienda_menu') {
        await interaction.deferReply({ ephemeral: true });
        const opcion = interaction.values[0];
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        try {
            let userXpData = await UserXP.findOne({ userId, guildId });
            if (!userXpData) userXpData = new UserXP({ userId, guildId, xp: 0, level: 1 });

            let xpTotalActual = userXpData.xp + (userXpData.level - 1) * 100;

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
        if (!userXpData) {
            return await interaction.editReply('Puchica maje, aún no tenés registro de XP ni compras en Zeus.');
        }

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

        const opcionesCarteles = carteles.map(c => ({
            label: `Fondo: ${c}`,
            value: `equipar_cartel_${c}`,
            emoji: '🖼️'
        }));

        const menuCarteles = new StringSelectMenuBuilder()
            .setCustomId('equipar_cartel_menu')
            .setPlaceholder('Elegí un fondo para equipar...')
            .addOptions(opcionesCarteles);

        const opcionesFuentes = fuentes.map(f => ({
            label: `Fuente: ${f}`,
            value: `equipar_fuente_${f}`,
            emoji: '✍️'
        }));

        const menuFuentes = new StringSelectMenuBuilder()
            .setCustomId('equipar_fuente_menu')
            .setPlaceholder('Elegí una fuente para equipar...')
            .addOptions(opcionesFuentes);

        const filaCarteles = new ActionRowBuilder().addComponents(menuCarteles);
        const filaFuentes = new ActionRowBuilder().addComponents(menuFuentes);

        await interaction.editReply({
            embeds: [perfilEmbed],
            components: [filaCarteles, filaFuentes]
        });
        return;
    }

    // 4. SELECCIÓN DE ARMARIO EN /PERFIL
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

            // 5. COMANDO /SETBG (BLOQUEADO SOLO PARA PEPO)
    if (interaction.isChatInputCommand() && interaction.commandName === 'setbg') {
        if (interaction.user.id !== PEPO_ID) {
            return await interaction.reply({
                content: '❌ **¡Aguantá el coche, maje!** Este comando solo lo puede usar Pepo.',
                ephemeral: true
            });
        }

        await interaction.deferReply({ ephemeral: true });

        const nombreId = interaction.options.getString('nombre_id');
        const imagen = interaction.options.getAttachment('imagen');
        const precio = interaction.options.getInteger('precio');
        const nivel = interaction.options.getInteger('nivel');

        await interaction.editReply(`✅ ¡Fondo **${nombreId}** subido al servidor!\n💰 Precio: **${precio} XP**\n⭐ Nivel requerido: **Nivel ${nivel}**\n🔗 URL: ${imagen.url}`);
        return;
    }

    // 6. COMANDO /CRITICA (BLOQUEADO SOLO PARA PEPO)
    if (interaction.isChatInputCommand() && interaction.commandName === 'critica') {
        if (interaction.user.id !== PEPO_ID) {
            return await interaction.reply({
                content: '❌ **¡Aguantá el coche, maje!** Este comando solo lo puede usar Pepo para las críticas de `#semanal`.',
                ephemeral: true
            });
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

        

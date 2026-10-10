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
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const path = require('path');
require('dotenv').config();

const UserXP = require('./UserXP.js'); // Asegúrate que en UserXP.js agregaste: cartelesComprados, cartelEquipado, fuentesCompradas, fuenteEquipada

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// Roles de XP
const ROL_XP_X4 = '123456789012345678';
const ROL_XP_X2 = '1545950431908470865';
const ROL_OCULTO = '1545963099788410950';

const nivelesRoles = [
    { min: 1000, max: 99999, id: '1545889068961861480' },
    // ... tus otros rangos de niveles ...
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
    description: 'Abre la tienda de Zeus para comprar bendiciones temporales y cosméticos para #semanal'
};

// 🎨 NUEVO COMANDO SLASH: /critica
const dataCritica = {
    name: 'critica',
    description: 'Genera la tarjeta gráfica de evaluación semanal para un artista',
    options: [
        { name: 'artista', type: ApplicationCommandOptionType.User, description: 'El artista a evaluar', required: true },
        { name: 'foto', type: ApplicationCommandOptionType.Attachment, description: 'El dibujo o imagen a criticar', required: true },
        { name: 'lo_bueno', type: ApplicationCommandOptionType.String, description: 'Aspectos positivos / Lo fuerte', required: true },
        { name: 'lo_malo', type: ApplicationCommandOptionType.String, description: 'Aspectos a corregir / El freno', required: true },
        { name: 'resumen', type: ApplicationCommandOptionType.String, description: 'Veredicto final de Pepo', required: true }
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
        await client.application.commands.create(dataCritica); // Registrar /critica
        console.log('Comandos listos compa > < :v');
    } catch (error) {
        console.error('Error con los comandos:', error);
    }
});

// --- FUNCIÓN HELPER CANVAS PARA GENERAR LA FICHA ---
async function generarTarjetaCritica({ dibujoUrl, artistaNombre, loBueno, loMalo, resumen, cartel, fuente }) {
    const width = 1000;
    const height = 600;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // 1. Cargar Cartel / Fondo
    try {
        const bgPath = path.join(__dirname, 'backgrounds', `${cartel || 'cartel_base'}.png`);
        const fondoImg = await loadImage(bgPath);
        ctx.drawImage(fondoImg, 0, 0, width, height);
    } catch (e) {
        // Fondo base oscuro
        ctx.fillStyle = '#18181c';
        ctx.fillRect(0, 0, width, height);
    }

    // 2. Marco Contenedor
    ctx.fillStyle = 'rgba(20, 20, 28, 0.88)';
    ctx.roundRect(30, 30, width - 60, height - 60, 20);
    ctx.fill();

    // 3. Dibujo del Artista
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

    // 4. Tipografía y Textos
    const fontName = fuente || 'sans-serif';
    
    // Titulo
    ctx.fillStyle = '#FFD700';
    ctx.font = `bold 24px ${fontName}`;
    ctx.fillText(`🎨 EVALUACIÓN: @${artistaNombre}`, 480, 85);

    // Separador
    ctx.strokeStyle = '#3A3A4A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(480, 100);
    ctx.lineTo(940, 100);
    ctx.stroke();

    const wrapText = (context, label, text, colorLabel, x, y, maxWidth, lineHeight) => {
        context.font = `bold 18px ${fontName}`;
        context.fillStyle = colorLabel;
        context.fillText(label, x, y);
        
        context.font = `16px ${fontName}`;
        context.fillStyle = '#FFFFFF';
        
        const words = text.split(' ');
        let line = '';
        let currentY = y + 22;

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
        return currentY + 15;
    };

    // Lo Bueno
    let nextY = wrapText(ctx, '🟢 LO FUERTE:', loBueno, '#4EAE50', 480, 130, 450, 22);

    // Lo Malo
    nextY = wrapText(ctx, '🔴 EL FRENO:', loMalo, '#F44336', 480, nextY, 450, 22);

    // Resumen / Veredicto
    wrapText(ctx, '⚡ VEREDICTO DE PEPO:', resumen, '#FFC107', 480, nextY, 450, 22);

    return canvas.toBuffer('image/png');
}

// --- TIENDA Y COMANDOS INTERACTIVOS ---
client.on('interactionCreate', async (interaction) => {
    
    // 1. ABRIR TIENDA CON COMANDO /COMPRAR
    if (interaction.isChatInputCommand() && interaction.commandName === 'comprar') {
        const tiendaEmbed = new EmbedBuilder()
            .setColor('#00ffaa')
            .setTitle('🛒 Tienda de Bendiciones y Cosméticos de Zeus')
            .setDescription('Gasta tu XP acumulada para obtener ventajas temporales y cosméticos para `#semanal` 🔥')
            .addFields(
                { name: '⚡ Rol XP x2 (3,000 XP)', value: 'Duplica tu XP por 1 día.' },
                { name: '👁️ Canales Ocultos (5,000 XP)', value: 'Acceso a canales ocultos por 1 día.' },
                { name: '🎁 Caja de Regalo (2,000 XP)', value: 'Proba tu suerte abriendo la caja.' },
                { name: '🖼️ Cartel Neón (4,000 XP)', value: 'Desbloquea el marco neón para tus fichas.' },
                { name: '📜 Cartel Pergamino (6,000 XP)', value: 'Desbloquea el estilo antiguo/gótico.' },
                { name: '✍️ Fuente Gótica (2,500 XP)', value: 'Desbloquea la tipografía de estatus.' }
            )
            .setFooter({ text: 'Tienda Oficial - Zeus', iconURL: client.user.displayAvatarURL() });

        const menuSelec = new StringSelectMenuBuilder()
            .setCustomId('tienda_menu')
            .setPlaceholder('Elegí un producto para comprar...')
            .addOptions([
                { label: 'Rol XP x2 (3,000 XP)', value: 'comprar_x2', emoji: '⚡' },
                { label: 'Canales Ocultos (5,000 XP)', value: 'comprar_ocultos', emoji: '👁️' },
                { label: 'Caja de Regalo (2,000 XP)', value: 'comprar_caja', emoji: '🎁' },
                { label: 'Cartel Neón (4,000 XP)', value: 'comprar_cartel_neon', emoji: '🖼️' },
                { label: 'Cartel Pergamino (6,000 XP)', value: 'comprar_cartel_pergamino', emoji: '📜' },
                { label: 'Fuente Gótica (2,500 XP)', value: 'comprar_fuente_gotica', emoji: '✍️' }
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

            // Funciones de XP (obtenerXpTotal / recalcularProgreso)...
            let xpTotalActual = userXpData.xp + (userXpData.level - 1) * 100; // Lógica resumida de tu script

            // Compras de Carteles
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

            // Compras de Fuentes
            if (opcion === 'comprar_fuente_gotica') {
                const precio = 2500;
                if (xpTotalActual < precio) return await interaction.editReply('Puchica maje, no te alcanza la XP.');

                if (!userXpData.fuentesCompradas) userXpData.fuentesCompradas = ['sans-serif'];
                userXpData.fuentesCompradas.push('gotica');
                userXpData.fuenteEquipada = 'gotica';
                await userXpData.save();
                return await interaction.editReply('✍️ ¡Compraste y equipaste la **Fuente Gótica**!');
            }

            // ... tus otras opciones existentes (comprar_x2, comprar_ocultos, comprar_caja) ...

        } catch (err) {
            console.error('Clavo en la tienda:', err);
            await interaction.editReply('Puchica, algo tronó al intentar hacer la compra.');
        }
        return;
    }

    // 3. COMANDO SLASH /CRITICA (EXCLUSIVO PEPO)
    if (interaction.isChatInputCommand() && interaction.commandName === 'critica') {
        await interaction.deferReply();

        const artista = interaction.options.getUser('artista');
        const foto = interaction.options.getAttachment('foto');
        const loBueno = interaction.options.getString('lo_bueno');
        const loMalo = interaction.options.getString('lo_malo');
        const resumen = interaction.options.getString('resumen');

        try {
            // Buscar perfil del artista en MongoDB
            let datosArtista = await UserXP.findOne({ userId: artista.id, guildId: interaction.guild.id });
            const cartelUsar = datosArtista?.cartelEquipado || 'cartel_base';
            const fuenteUsar = datosArtista?.fuenteEquipada || 'sans-serif';

            // Generar la imagen Canvas
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
                 

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
require('dotenv').config();

const UserXP = require('./UserXP.js');
const Background = require('./Background.js');

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

const ROL_XP_X4 = '123456789012345678';
const ROL_XP_X2 = '1545950431908470865';
const ROL_OCULTO = '1545963099788410950';

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

const rolesTop3 = ['1541902325784912064', '1541902188895412405', '1541899453521330216'];

mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI)
    .then(() => console.log('Base de datos conectada al 100 > < :v'))
    .catch(err => console.error('Puchica fallo la base de datos:', err));

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

const dataTop = { name: 'top', description: 'Muestra el Top 10 de majes con más XP' };
const dataComprar = { name: 'comprar', description: 'Abre la tienda de Zeus' };
const dataPerfil = { name: 'perfil', description: 'Abre tu armario de fondos' };

const dataCritica = {
    name: 'critica',
    description: 'Genera la tarjeta gráfica para un artista (Exclusivo Pepo)',
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
    description: 'Sube/asigna un fondo directo a MongoDB (Exclusivo Pepo)',
    options: [
        { name: 'nombre_id', type: ApplicationCommandOptionType.String, description: 'Nombre único del fondo', required: true },
        { name: 'imagen', type: ApplicationCommandOptionType.Attachment, description: 'La imagen PNG/JPG', required: true },
        { name: 'precio', type: ApplicationCommandOptionType.Integer, description: 'Precio en XP (Opcional)', required: false },
        { name: 'nivel', type: ApplicationCommandOptionType.Integer, description: 'Nivel mínimo (Opcional)', required: false },
        { name: 'usuario', type: ApplicationCommandOptionType.User, description: 'Regalar/asignar a un usuario específico (Opcional)', required: false }
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

// --- RENDERIZADOR CANVAS ---
async function generarTarjetaCritica({ dibujoUrl, artistaNombre, loBueno, loMalo, resumen, fondoUrl }) {
    const width = 1000;
    const height = 600;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    if (fondoUrl) {
        try {
            const fondoImg = await loadImage(fondoUrl);
            ctx.drawImage(fondoImg, 0, 0, width, height);
        } catch (e) {
            ctx.fillStyle = '#121216';
            ctx.fillRect(0, 0, width, height);
        }
    } else {
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

    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText(`🎨 EVALUACIÓN: @${artistaNombre}`, 480, 85);

    ctx.strokeStyle = '#3A3A4A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(480, 105);
    ctx.lineTo(940, 105);
    ctx.stroke();

    const wrapText = (context, label, text, colorLabel, x, startY, maxWidth, lineHeight) => {
        context.font = 'bold 20px sans-serif';
        context.fillStyle = colorLabel;
        context.fillText(label, x, startY);
        
        context.font = '18px sans-serif';
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
    
    // A. COMANDOS SLASH
    if (interaction.isChatInputCommand()) {
        const { commandName } = interaction;

        // /comprar
        if (commandName === 'comprar') {
            await interaction.deferReply();

            // Muestra únicamente los que TENGAN PRECIO asignado
            const fondosTienda = await Background.find({ 
                guildId: interaction.guild.id, 
                precio: { $ne: null } 
            });

            const tiendaEmbed = new EmbedBuilder()
                .setColor('#00ffaa')
                .setTitle('🛒 Tienda de Zeus & #semanal')
                .setDescription('Gasta tu XP acumulada para obtener ventajas o cosméticos de la base de datos 🔥')
                .addFields(
                    { name: '⚡ Rol XP X2 (3,000 XP)', value: 'Duplica tu XP por 1 día.' },
                    { name: '👁️ Canales Ocultos (5,000 XP)', value: 'Acceso a canales ocultos por 1 día.' },
                    { name: '🎁 Caja de Regalo (2,000 XP)', value: 'Premio de XP al azar.' }
                )
                .setFooter({ text: 'Tienda Oficial - Zeus', iconURL: client.user.displayAvatarURL() });

            const opcionesMenu = [
                { label: 'Rol XP X2 (3,000 XP)', description: 'Duplica tu XP por 1 día', value: 'comprar_x2', emoji: '⚡' },
                { label: 'Canales Ocultos (5,000 XP)', description: 'Acceso por 1 día', value: 'comprar_ocultos', emoji: '👁️' },
                { label: 'Caja de Regalo (2,000 XP)', description: 'Misteriosa de Zeus', value: 'comprar_caja', emoji: '🎁' }
            ];

            fondosTienda.forEach(f => {
                const reqNivelTxt = f.nivelMinimo ? ` (Req. Nivel ${f.nivelMinimo})` : '';
                tiendaEmbed.addFields({
                    name: `🖼️ Fondo: ${f.nombreId} (${f.precio} XP)`,
                    value: f.nivelMinimo ? `Requiere Nivel ${f.nivelMinimo}` : 'Disponible para todos'
                });
                opcionesMenu.push({
                    label: `Fondo: ${f.nombreId} (${f.precio} XP)`,
                    description: f.nivelMinimo ? `Req. Nivel ${f.nivelMinimo}` : 'Para todos',
                    value: `comprar_bg_${f.nombreId}`,
                    emoji: '🖼️'
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

        // /perfil (ARMARIO)
        if (commandName === 'perfil') {
            await interaction.deferReply({ ephemeral: true });

            const userId = interaction.user.id;
            const guildId = interaction.guild.id;

            let userXpData = await UserXP.findOne({ userId, guildId });
            const nivelUsuario = userXpData ? userXpData.level : 1;
            const compradosOAsignados = userXpData?.cartelesComprados || [];

            // 1. Desbloqueados por nivel (Sin precio y Nivel <= Nivel Usuario)
            const desbloqueadosPorNivel = await Background.find({
                guildId,
                precio: null,
                nivelMinimo: { $ne: null, $lte: nivelUsuario }
            });

            // 2. Predeterminados para todos (Sin precio Y sin nivel)
            const predeterminados = await Background.find({
                guildId,
                precio: null,
                nivelMinimo: null
            });

            const nombresGratis = [...desbloqueadosPorNivel, ...predeterminados].map(b => b.nombreId);
            
            // Unir sin duplicados
            const todosMisFondos = [...new Set([...compradosOAsignados, ...nombresGratis])];

            if (todosMisFondos.length === 0) {
                return await interaction.editReply('Puchica maje, aún no hay fondos registrados en el servidor.');
            }

            const perfilEmbed = new EmbedBuilder()
                .setColor('#9b59b6')
                .setTitle(`🎨 Armario de Cosméticos de ${interaction.user.username}`)
                .setDescription('Elegí cuál de tus fondos guardados, comprados o regalados querés equipar para `#semanal`!')
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
                return await interaction.reply({ content: '❌ Solo Pepo puede usar este comando.', ephemeral: true });
            }

            await interaction.deferReply({ ephemeral: true });

            const nombreId = interaction.options.getString('nombre_id');
            const imagen = interaction.options.getAttachment('imagen');
            const precio = interaction.options.getInteger('precio');
            const nivel = interaction.options.getInteger('nivel');
            const usuarioEspecial = interaction.options.getUser('usuario');

            // Guardar o actualizar en MongoDB
            await Background.findOneAndUpdate(
                { guildId: interaction.guild.id, nombreId },
                { 
                    imageUrl: imagen.url, 
                    precio: precio !== null ? precio : null, 
                    nivelMinimo: nivel !== null ? nivel : null 
                },
                { upsert: true, new: true }
            );

            // Regalo directo a un usuario
            if (usuarioEspecial) {
                let userXpData = await UserXP.findOne({ userId: usuarioEspecial.id, guildId: interaction.guild.id });
                if (!userXpData) {
                    userXpData = new UserXP({ userId: usuarioEspecial.id, guildId: interaction.guild.id, xp: 0, level: 1 });
                }

                if (!userXpData.cartelesComprados) userXpData.cartelesComprados = [];
                if (!userXpData.cartelesComprados.includes(nombreId)) {
                    userXpData.cartelesComprados.push(nombreId);
                }
                userXpData.cartelEquipado = nombreId;
                await userXpData.save();

                return await interaction.editReply(`🎁 ¡Fondo **${nombreId}** regalado y equipado a <@${usuarioEspecial.id}>!\n🖼️ URL: ${imagen.url}`);
            }

            let modoTxt = '';
            if (precio !== null && nivel !== null) {
                modoTxt = `🛒 **Tienda:** Cuesta **${precio} XP** y requiere **Nivel ${nivel}**.`;
            } else if (precio !== null) {
                modoTxt = `🛒 **Tienda:** Cuesta **${precio} XP** para todos.`;
            } else if (nivel !== null) {
                modoTxt = `🎁 **Recompensa Gratis:** Se desbloquea al llegar a **Nivel ${nivel}**.`;
            } else {
                modoTxt = `🔓 **Predeterminado:** Gratis y disponible en el armario de TODOS.`;
            }

            await interaction.editReply(`✅ ¡Fondo **${nombreId}** guardado!\n${modoTxt}\n🖼️ URL: ${imagen.url}`);
            return;
        }

        // /critica (EXCLUSIVO PEPO)
        if (commandName === 'critica') {
            if (interaction.user.id !== PEPO_ID) {
                return await interaction.reply({ content: '❌ Solo Pepo puede evaluar en `#semanal`.', ephemeral: true });
            }

            await interaction.deferReply();

            const artista = interaction.options.getUser('artista');
            const foto = interaction.options.getAttachment('foto');
            const loBueno = interaction.options.getString('lo_bueno');
            const loMalo = interaction.options.getString('lo_malo');
            const resumen = interaction.options.getString('resumen');

            try {
                let datosArtista = await UserXP.findOne({ userId: artista.id, guildId: interaction.guild.id });
                const nombreCartel = datosArtista?.cartelEquipado;

                let urlFondoUsar = null;
                if (nombreCartel) {
                    const bgObj = await Background.findOne({ guildId: interaction.guild.id, nombreId: nombreCartel });
                    if (bgObj) urlFondoUsar = bgObj.imageUrl;
                }

                const bufferFicha = await generarTarjetaCritica({
                    dibujoUrl: foto.url,
                    artistaNombre: artista.username,
                    loBueno,
                    loMalo,
                    resumen,
                    fondoUrl: urlFondoUsar
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
    }

    // B. MENÚS DESPLEGABLES
    if (interaction.isStringSelectMenu()) {
        const { customId, values } = interaction;

        if (customId === 'tienda_menu') {
            await interaction.deferReply({ ephemeral: true });
            const opcion = values[0];
            const userId = interaction.user.id;
            const guildId = interaction.guild.id;

            let userXpData = await UserXP.findOne({ userId, guildId });
            if (!userXpData) userXpData = new UserXP({ userId, guildId, xp: 0, level: 1 });

            let xpTotalActual = userXpData.xp + (userXpData.level - 1) * 100;

            if (opcion.startsWith('comprar_bg_')) {
                const nombreBg = opcion.replace('comprar_bg_', '');
                const bgData = await Background.findOne({ guildId, nombreId: nombreBg });

                                if (!bgData) return await interaction.editReply('Puchica, ese fondo ya no existe.');
                if (bgData.nivelMinimo && userXpData.level < bgData.nivelMinimo) {
                    return await interaction.editReply(`Necesitás ser al menos **Nivel ${bgData.nivelMinimo}** para comprarlo.`);
                }
                if (xpTotalActual < bgData.precio) {
                    return await interaction.editReply(`No te alcanza la XP. Cuesta **${bgData.precio} XP**.`);
                }

                if (!userXpData.cartelesComprados) userXpData.cartelesComprados = [];
                if (userXpData.cartelesComprados.includes(nombreBg)) {
                    userXpData.cartelEquipado = nombreBg;
                    await userXpData.save();
                    return await interaction.editReply(`Ya tenías este fondo. Te lo hemos **equipado**.`);
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
    }
});

client.login(process.env.TOKEN || process.env.DISCORD_TOKEN);

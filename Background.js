const mongoose = require('mongoose');

const backgroundSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    nombreId: { type: String, required: true },
    imageUrl: { type: String, required: true },
    precio: { type: Number, default: null },
    nivelMinimo: { type: Number, default: null }
}, { collection: 'zeus_backgrounds' }); // <--- ESTO CREA UNA COLECCIÓN NUEVA Y EVITA IR A ATLAS

module.exports = mongoose.model('Background', backgroundSchema);

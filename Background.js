const mongoose = require('mongoose');

const backgroundSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    nombreId: { type: String, required: true }, // Ej: 'cartel_fuego'
    imageUrl: { type: String, required: true }, // Link directo del adjunto
    precio: { type: Number, required: true },
    nivelMinimo: { type: Number, default: 1 }
});

module.exports = mongoose.model('Background', backgroundSchema);

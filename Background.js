const mongoose = require('mongoose');

const backgroundSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    nombreId: { type: String, required: true },
    imageUrl: { type: String, required: true },
    precio: { type: Number, default: null },     // Opcional
    nivelMinimo: { type: Number, default: null } // Opcional
});

module.exports = mongoose.model('Background', backgroundSchema);

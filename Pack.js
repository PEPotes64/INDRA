const mongoose = require('mongoose');

const packSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    nombreId: { type: String, required: true },
    fondoNombreId: { type: String, required: true },
    fuenteNombreId: { type: String, required: true },
    precio: { type: Number, default: null },
    nivelMinimo: { type: Number, default: null }
});

module.exports = mongoose.model('Pack', packSchema);

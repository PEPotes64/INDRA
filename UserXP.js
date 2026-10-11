const mongoose = require('mongoose');

const userXpSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },

    rolX2Hasta: { type: Date, default: null },
    rolOcultoHasta: { type: Date, default: null },

    ultimoUsoX2: { type: Date, default: null },
    ultimoUsoOculto: { type: Date, default: null },
    ultimoUsoCaja: { type: Date, default: null },

    cartelesComprados: { type: [String], default: ['cartel_base'] },
    cartelEquipado: { type: String, default: 'cartel_base' },
    fuentesCompradas: { type: [String], default: ['sans-serif'] },
    fuenteEquipada: { type: String, default: 'sans-serif' },
    packsComprados: { type: [String], default: [] },
    
    // ahora si activos para las tablas
    tablaEquipada: { type: String, default: null },
    tablasCompradas: { type: [String], default: [] }
});

const tablaSchema = new mongoose.Schema({
    guildId: String,
    nombreId: String,
    urlImagen: String,
    precio: { type: Number, default: null },
    nivelMinimo: { type: Number, default: null }
});

const Tabla = mongoose.model('Tabla', tablaSchema);

module.exports = mongoose.model('UserXP', userXpSchema);

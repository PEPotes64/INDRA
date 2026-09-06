const mongoose = require('mongoose');

const userXpSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  guildId: { type: String, required: true },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  // ⏱️ Campos para la expiración de roles comprados (1 día)
  rolX2Hasta: { type: Date, default: null },
  rolOcultoHasta: { type: Date, default: null },
  // ⏳ Campos para el cooldown de compra (2 días)
  ultimoUsoX2: { type: Date, default: null },
  ultimoUsoOculto: { type: Date, default: null },
  ultimoUsoCaja: { type: Date, default: null }
});

module.exports = mongoose.model('UserXP', userXpSchema);


const mongoose = require('mongoose');

// Genera un ObjectId válido sin tocar la base (sirve para relacionar mocks entre sí).
const newObjectId = () => new mongoose.Types.ObjectId();

module.exports = { newObjectId };

const mongoose = require('mongoose');

const botSchema = new mongoose.Schema({
    maintainance: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('Bot', botSchema, 'botSettings');
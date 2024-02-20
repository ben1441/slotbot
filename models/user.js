const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true,
        default: 0
    },
    action : {
        type: String,
        enum: ['add', 'remove'],
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const betSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true,
        default: 0
    },
    isWin: {
        type: Boolean,
        required: true,
        default: false
    },
    itemID: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

const userSchema = new mongoose.Schema({
    telegramId: {
        type: String,
        required: true,
        unique: true
    },
    balance: {
        type: Number,
        required: true,
        default: 0
    },
    isBanned: {
        type: Boolean,
        required: true,
        default: false
    },
    transactions: {
        type: [transactionSchema],
        default: []
    },
    bets: {
        type: [betSchema],
        default: []
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const User = mongoose.model('shop_users', userSchema, 'bet_users');

module.exports = User;
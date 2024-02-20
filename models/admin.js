const mongoose = require('mongoose');

const banSchema = new mongoose.Schema({
    ban: {
        type: Boolean,
        default: false
    },
    unban: {
        type: Boolean,
        default: false
    }
}, {
    _id: false
});

const balanceSchema = new mongoose.Schema({
    add: {
        type: Boolean,
        default: false
    },
    deduct: {
        type: Boolean,
        default: false
    }
}, {
    _id: false
});

const itemsSchema = new mongoose.Schema({
    add: {
        type: Boolean,
        default: false
    },
    replace: {
        type: Boolean,
        default: false
    },
    delete: {
        type: Boolean,
        default: false
    }
}, {
    _id: false
});

const usersSchema = new mongoose.Schema({
    ban: {
        type: banSchema,
        default: () => ({})
    },
    balance: {
        type: balanceSchema,
        default: () => ({})
    },
    items: {
        type: itemsSchema,
        default: () => ({})
    },
    transaction: {
        type: Boolean,
        default: false
    },
    bets: {
        type: Boolean,
        default: false
    }
}, { _id: false });

const permissionSchema = new mongoose.Schema({
    users: {
        type: usersSchema,
        default: () => ({})
    },
    items: {
        type: itemsSchema,
        default: () => ({})
    }
}, {
    _id: false
});

const adminSchema = new mongoose.Schema({
    telegramId: {
        type: Number,
        required: true
    },
    permissions: {
        type: permissionSchema,
        required: true,
        default: () => ({})
    }
});

module.exports = mongoose.model('Admin', adminSchema, 'adminSettings');
const User = require('../models/user');
const Item = require('../models/item');
const Bot = require('../models/bot');
const Admin = require('../models/admin');

const log = require('./logger')

async function createUser(telegramId) {
    const user = new User({
        telegramId
    });
    log.info(`New user created: ${telegramId}`);
    await user.save();
    return user;
}

async function userExists(telegramId) {
    const user = await User.findOne({ telegramId });
    return !!user;
}

async function getData(telegramId) {
    const user = await User.findOne({ telegramId }).lean();
    return user;
}

async function getUsers() {
    const users = await User.find().lean();
    return users;
}

/*START Balance Functions*/
async function addBalance(telegramId, amount, type) {
    const user = await User.findOne({ telegramId });
    user.balance += amount;
    user.transactions.push({ amount, type, action: 'add' });
    await user.save();
    log.warn(`Balance added: ${amount} to ${telegramId}`);
    return user;
}

async function removeBalance(telegramId, amount, type) {
    const user = await User.findOne({ telegramId });
    user.balance -= amount;
    user.transactions.push({ amount, type, action: 'remove' });
    await user.save();
    log.warn(`Balance removed: ${amount} from ${telegramId}`);
    return user;
}

async function setBanStatus(telegramId, status) {
    const user = await User.findOne({ telegramId });
    user.isBanned = status;
    await user.save();
    log.warn(`User ${telegramId} banStatus: ${status}`);
    return user;
}
/*END Balance Functions*/

async function saveBet(telegramId, bet, isWin, itemID) {
    const user = await User.findOne({ telegramId });
    user.bets.push({ bet, isWin, itemID });
    await user.save();
    return user;
}

async function getItems(id) {
    const item = await Item.findById(id) || await Item.find()
    if (!item) return null
    return item
}

async function saveItems(name, description, price, imagePath) {
    const items = new Item({ name, description, price, imagePath })
    await items.save();
    return items;
}

async function removeItems(id) {
    await Item.findByIdAndDelete(id)
    return true
}

async function getSettings(name) {
    const bot = await Bot.findOne({})
    if (!bot) return null;
    return bot[name];
}

async function setSettings(name, value) {
    const bot = await Bot.findOne({})
    if (!bot) return null;
    bot[name] = value;
    await bot.save();
    return bot;
}

async function toggle(name) {
    const bot = await Bot.findOne({})
    if (!bot) return { ok: false, message: 'Not found' };
    bot[name] = !bot[name];
    await bot.save();
    return bot
}


//_________________________________

async function getAdmins(id) {
    const admins = !id ? await Admin.find({}).lean() : await Admin.findOne({ telegramId: id }).lean()
    if (!admins) return null;
    return admins;
}

async function addAdmin(telegramId) {
    const admin = new Admin({
        telegramId
    });
    log.info(`New admin created: ${telegramId}`);
    await admin.save();
    return admin;
}

async function removeAdmin(telegramId) {
    await Admin.findOneAndDelete({ telegramId });
    return true;
}

async function adminExists(telegramId) {
    const admin = await Admin.findOne({ telegramId });
    return !!admin;
}

module.exports = {
    createUser,
    userExists,
    getData,
    addBalance,
    removeBalance,
    setBanStatus,
    saveBet,
    getItems,
    saveItems,
    removeItems,
    getSettings,
    setSettings,
    toggle,
    getAdmins,
    removeAdmin,
    addAdmin,
    getUsers,
    adminExists
};

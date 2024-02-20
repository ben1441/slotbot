const { Composer, InlineKeyboard } = require('grammy');
const { createConversation } = require('@grammyjs/conversations');
const db = require('../../functions/database');
const log = require('../../functions/logger');

const bott = new Composer();
const bot = bott.filter(ctx => ctx.config.adminList.includes(ctx.from.id));
bot.use(createConversation(addAdmin));
bot.use(createConversation(searchAdmin));

bot.hears('📤 Add admin', async ctx => {
    await ctx.conversation.enter('addAdmin');
})

async function addAdmin(conversation, ctx) {
    await ctx.reply('Enter the id of the user you want to make an admin:');
    const id = await conversation.form.number();
    let user = await db.getData(id);
    if (!user) return ctx.reply('User not found!');

    let admin = await db.adminExists(id);
    if (admin) return ctx.reply('User is already an admin!');

    await db.addAdmin(id);
    await ctx.reply(`*✅ Admin added!*\n_Press on the button below to manage them!_`, {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
            .text('👤 View admin', `manageAdmin ${id}`)
    });
}

bot.hears('🔍 Search Admin', async ctx => {
    await ctx.conversation.enter('searchAdmin');
})

async function searchAdmin(conversation, ctx) {
    await ctx.reply('Enter the id of the admin you want to search for:');
    const id = await conversation.form.number();
    let admin = await db.getAdmins(id);
    if (!admin) return ctx.reply('Admin not found!');
    await ctx.reply(`*✅ Admin found!*\n_Press on the button below to check them out!_`, {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
            .text('👤 View admin', `manageAdmin ${id}`)
    });
}

const capitalize = (s) => s.substring(0, 1).toUpperCase() + s.substring(1);

bot.callbackQuery(/manageAdmin (.+)/, async ctx => {
    ctx.answerCallbackQuery()
    let admin = await db.getAdmins(ctx.match[1]);
    var keyBoard = new InlineKeyboard()
    .text('🚫 Remove admin', `removeAdmin ${admin.telegramId}`).row()
    .text(`${admin.permissions.users.ban.ban ? '✅' : '❌'} Ban users` , `toggleAdmin ban ${admin.telegramId}`)
    .text(`${admin.permissions.users.ban.unban ? '✅' : '❌'} UnBan users` , `toggleAdmin unban ${admin.telegramId}`).row()
    .text(`${admin.permissions.users.balance.add ? '✅' : '❌'} Add balance` , `toggleAdmin add ${admin.telegramId}`)
    .text(`${admin.permissions.users.balance.remove ? '✅' : '❌'} Remove balance` , `toggleAdmin remove ${admin.telegramId}`).row()
    .text(`${admin.permissions.users.items.add ? '✅' : '❌'} Add User items` , `toggleAdmin itemsUserAdd ${admin.telegramId}`).row()
    .text(`${admin.permissions.users.items.replace ? '✅' : '❌'} Replace User items` , `toggleAdmin itemsUserReplace ${admin.telegramId}`)
    .text(`${admin.permissions.users.items.delete ? '✅' : '❌'} Delete User items` , `toggleAdmin itemsUserDelete ${admin.telegramId}`).row()
    .text(`${admin.permissions.users.transaction ? '✅' : '❌'} View Transaction` , `toggleAdmin transaction ${admin.telegramId}`)
    .text(`${admin.permissions.users.bets ? '✅' : '❌'} Bets` , `toggleAdmin bets ${admin.telegramId}`).row()
    .text(`${admin.permissions.items.add ? '✅' : '❌'} Add items` , `toggleAdmin itemsAdd ${admin.telegramId}`)
    .text(`${admin.permissions.items.replace ? '✅' : '❌'} Replace items` , `toggleAdmin itemsReplace ${admin.telegramId}`).row()
    .text(`${admin.permissions.items.delete ? '✅' : '❌'} Delete items` , `toggleAdmin itemsDelete ${admin.telegramId}`)
    
    await ctx[ctx.callbackQuery ? 'editMessageText' : 'reply'](`<b>👤 Admin</b>\n\nID: <a href='tg://user?id=${admin.telegramId}'>${admin.telegramId}</a>\n\n<i>Press the button below to see more!</i>`, {
        parse_mode: 'HTML',
        reply_markup: keyBoard

    });
})

bot.callbackQuery(/removeAdmin( (.+))?/, async ctx => {
    ctx.answerCallbackQuery()
    await db.removeAdmin(ctx.match[1]);
    await ctx[ctx.callbackQuery ? 'editMessageText' : 'reply']('Admin removed!', {
        parse_mode: 'Markdown'
    });
})

module.exports = bot;
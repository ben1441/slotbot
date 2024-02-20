require('dotenv').config();
const { Composer, InlineKeyboard, Keyboard } = require('grammy');
const db = require('../../functions/database');

const bott = new Composer();


const bot = bott.filter(ctx => ctx.config.adminList.includes(ctx.from.id));

bot.hears(['👮 Admin Panel', '🔙 Back to admin panel'], async ctx => {
    await ctx.reply('Welcome to the admin panel!', {
        reply_markup: new Keyboard()
            .text('✍️ Item management').row()
            .text('👥 User management')
            .text('👤 Admin Management').row()
            .text('🤖 Bot settings').row()
            .text('🔙 Back to main menu')
            .resized()
    });
})

bot.hears('✍️ Item management', async ctx => {
    await ctx.reply('Welcome to the item management panel!', {
        reply_markup: new Keyboard()
            .text('📤 Add item')
            .text('📥 Remove item').row()
            .text('✍️ View items')
            .text('✍️ Edit item').row()
            .text('🔙 Back to admin panel')
            .resized()
    });
})

bot.hears('🤖 Bot settings', async ctx => {
    await ctx.reply('Welcome to the bot settings panel!', {
        reply_markup: new InlineKeyboard()
            .text('🔒 Maintainance mode')
    });
})

bot.hears('👤 Admin Management', async ctx => {
    await ctx.reply('Welcome to the admin management panel!', {
        reply_markup: new Keyboard()
            .text('📤 Add admin').row()
            .text('🔍 Search Admin')
            .text('✍️ Manage admins').row()
            .text('🔙 Back to admin panel')
            .resized()
    });
})

bot.hears('👥 User management', async ctx => {
    await ctx.reply('Welcome to the user management panel!\n\n Choose any of the ways to choose user.', {
        reply_markup: new Keyboard()
            .text('🔍 Search user')
            .text('📃 User list').row()
            .text('🔙 Back to admin panel')
            .resized()
    });
})

module.exports = bot;
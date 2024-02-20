const { Composer, InlineKeyboard } = require('grammy')
const { fmt, pre } = require("@grammyjs/parse-mode",);
const { createConversation } = require('@grammyjs/conversations')
const table = require('string-table')
const db = require('../../functions/database')
const log = require('../../functions/logger')

const bot = new Composer()

bot.use(createConversation(searchUser))
bot.use(createConversation(manipulateBalance))

const admin = bot.filter(ctx => ctx.config.adminList.includes(ctx.from.id));

admin.hears('🔍 Search user', async ctx => {
    await ctx.conversation.enter('searchUser');
})

async function searchUser(conversation, ctx) {
    await ctx.reply('Enter the id of the user you want to search for:');
    const id = await conversation.form.number();
    let user = await db.getData(id);
    if (!user) return ctx.reply('User not found!');
    await ctx.reply(`*✅ User found!*\n_Press on the button below to check them out!_`, {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
            .text('👤 View user', `manageUser ${id}`)
    });
}

async function userListHandler(ctx) {
    const array = await db.getUsers();
    let params = parseInt(ctx.match[1]) || 0;
    let dataPerPage = 10;
    if (array.length === 0) return ctx.reply('No users found!');
    let keyBoard = new InlineKeyboard()
    array.slice(params * dataPerPage, (params + 1) * dataPerPage).forEach(x => keyBoard.text(x.telegramId, `manageUser ${x.telegramId}`))
    keyBoard = keyBoard.toFlowed(2)
    if (params !== 0) keyBoard.text("Back", `userList ${params - 1} `);
    if ((params + 1) * dataPerPage < array.length) keyBoard.text("Next", `userList ${params + 1} `);
    keyBoard.row()
    if (Math.floor(array.length / dataPerPage) > 0) keyBoard.text('Page: ' + (params + 1) + '/' + Math.ceil(array.length / dataPerPage), 'null').row()

    await ctx[ctx.callbackQuery ? 'editMessageText' : 'reply'](`*📃 User List*\n\n_Press on the button below to navigate_`, {
        parse_mode: 'Markdown',
        reply_markup: keyBoard
    })
}

admin.hears('📃 User list', userListHandler)
admin.callbackQuery(/userList (.+)/, userListHandler)

admin.callbackQuery(/manageUser (.+)/, async ctx => {
    ctx.answerCallbackQuery()
    let user = await db.getData(ctx.match[1]);
    await ctx[ctx.callbackQuery ? 'editMessageText' : 'reply'](`<b>👤 User</b>\n\nID: <a href='tg://user?id=${user.telegramId}'>${user.telegramId}</a>\nBalance: ${user.balance}\nTotal bets made: ${user.bets.length}\nTotal transactions made: ${user.transactions.length}\n\n<i>Press the button below to see more!</i>`, {
        parse_mode: 'HTML',
        reply_markup: new InlineKeyboard()
            .text(`➕ Add balance`, `addBalance ${user.telegramId}`)
            .text(`➖ Remove balance`, `removeBalance ${user.telegramId}`).row()
            .text(`📃 Transaction history`, `transactionHistory ${user.telegramId}`).row()
            .text(`📃 Bet history`, `betHistory ${user.telegramId}`)
            .text(`📦 Items`, `userItems ${user.telegramId}`).row()
            .text(`🔃 Reload`, `manageUser ${user.telegramId}`)
            .text(`🔙 Back to User lists`, 'userList 0')
    });
})

admin.callbackQuery(/(transactionHistory|betHistory) (.+)(?: (.+))?/, async ctx => {
    let user = await db.getData(ctx.match[2]);
    let params = parseInt(ctx.match[3]) || 0;
    let dataPerPage = 10;
    let array = ctx.match[1] === 'transactionHistory' ? user.transactions : user.bets;
    if (array.length === 0) return ctx.answerCallbackQuery({
        text: 'No history found!',
        show_alert: true
    })

    array.slice(params * dataPerPage, (params + 1) * dataPerPage)

    let keyBoard = new InlineKeyboard()

    if (params !== 0) keyBoard.text("Back", `${callback} ${params - 1} `);
    if ((params + 1) * dataPerPage < array.length) keyBoard.text("Next", `${callback} ${params + 1} `);
    keyBoard.row()
    if (Math.floor(array.length / dataPerPage) > 0) keyBoard.text('Page: ' + (params + 1) + '/' + Math.ceil(array.length / dataPerPage), 'null').row()

    keyBoard.text(`🔙 Back to management`, `manageUser ${user.telegramId}`)

    await ctx.editMessageText(`*📃 ${ctx.match[1] === 'transactionHistory' ? 'Transaction' : 'Bet'} history*\n\n${array.map((x, i) => `*${x.action === 'add' ? '+' : '-'}${x.amount}*\n _Type: ${x.type}_`).join('\n\n')}`, {
        parse_mode: 'Markdown',
        reply_markup: keyBoard
    });
})

admin.callbackQuery(/(addBalance|removeBalance) (.+)/, async ctx => {
    let user = await db.getData(ctx.match[2]);
    ctx.session.userID = user.telegramId;
    ctx.session.process = ctx.match[1];
    ctx.session.msg_id = ctx.callbackQuery.message.message_id;
    await ctx.editMessageText(`*${ctx.match[1] === 'removeBalance' ? '➖ Remove balance' : '➕ Add balance'}*\n\nEnter the amount you want to ${ctx.match[1].slice(0, -7)} to ${user.telegramId}'s balance:`, {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
            .text('❌ Cancel', 'cancel')
    }).catch(err => { })
    await ctx.conversation.enter('manipulateBalance');
})

async function manipulateBalance(conversation, ctx) {
    let amount = await conversation.waitUntil(ctx => {
        if (ctx.has([':text', 'callback_query'])) {
            if (ctx.has('callback_query') && ctx.callbackQuery.data === 'cancel') return ctx.editMessageText('Operation cancelled!', {
                reply_markup: new InlineKeyboard()
                    .text(`🔙 Back to management`, `manageUser ${ctx.session.userID}`)
            });;
            if (ctx.has(':text') && !isNaN(ctx.msg.text)) return true;
        }
    }, {
        otherwise: ctx => {
            if (ctx.has('callback_query')) return ctx.reply('Operation cancelled!', {
                reply_markup: new InlineKeyboard()
                    .text(`🔙 Back to management`, `manageUser ${ctx.session.userID}`)
            });
            if (isNaN(ctx.msg.text)) return ctx.reply('The amount must be a number!', {
                reply_markup: new InlineKeyboard()
                    .text('❌ Cancel', 'cancel')
            })
        }
    });
    if (amount.has('callback_query')) return

    amount.deleteMessage();
    if (isNaN(amount.msg.text)) return ctx.reply('The amount must be a number!', {
        reply_markup: new InlineKeyboard()
            .text('❌ Cancel', 'cancel')
    });
    amount = parseInt(amount.msg.text);

    const user = await db[ctx.session.process](ctx.session.userID, amount, 'manual ' + ctx.session.process.slice(0, -7));

    const replier = [`✅ ${amount} lei has been ${ctx.session.process === 'removeBalance' ? 'removed' : 'added'} to ${user.telegramId}'s balance!`, {
        reply_markup: new InlineKeyboard()
            .text(`🔙 Back to management`, `manageUser ${user.telegramId}`)
    }]
    await ctx.api.editMessageText(ctx.chat.id, ctx.session.msg_id, ...replier)
        .catch(async err => {
            await ctx.reply(...replier)
        })
}




module.exports = bot
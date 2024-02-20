const { Composer, InlineKeyboard } = require('grammy')
const db = require('../../functions/database')

const bot = new Composer()


profileHandler = async (ctx) => {
    var myInfo = await db.getData(ctx.from.id)
    await ctx[ctx.update.callback_query ? 'editMessageText' : 'reply'](`*👤Your profile*\n\n*User ID:* \`${myInfo.telegramId}\`\n*My balance:* ${myInfo.balance}$ lei\n*Total bets made:* ${myInfo.bets.length}\n\n_You joined at: ${myInfo.createdAt.toLocaleString()}_`, {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
            .text('📃 Bet History', 'history bets')
            .text('📃 Transactions', 'history transactions').row()
            .text('📦 My items', `history myImages`)
    })
}

bot.hears('🧑‍💼 Profile', profileHandler)
bot.callbackQuery('profile', profileHandler)

function title(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}


bot.callbackQuery(/history (.+)/, async (ctx) => {
    var myInfo = await db.getData(ctx.from.id);
    if (ctx.match[1] !== 'myImages') {
        var history = ctx.match[1] === 'transactions' ? myInfo.data.transactions : myInfo.data.bets;
        if (history.length === 0) {
            ctx.answerCallbackQuery(`You have not made any ${ctx.match[1]} yet!`);
            return
        }

        var text = ctx.match[1] === 'transactions'
            ? '*💰Last 10 Transactions*\n`----------------`\n' + history.map((t, i) => `*${i + 1}. ${title(t.type)}*\n _Amount: ${t.amount.toFixed(2)}_\n _Date: ${t.date.toLocaleString()} UTC_`).join('\n')
            : '*📜Last 10 Bet History*\n`----------------`\n' + history.map((h, i) => `*${i + 1}. ${title(h.status)} *\n _Amount: ${h.amount.toFixed(2)}_`).join('\n');
    } else {
        if (myInfo.data.myItems.length === 0) return ctx.answerCallbackQuery(`You do not any items yet!`);

        var images = await db.getImage()
        var text = '*🖼️ My items*\n\n' + myInfo.data.myItems.map(async (v, i) => {
            var imageData = images.items[v._id];
            return `*${index + 1}. ${imageData.title} (${await db.convertCurrency(imageData.price, 'USD', myInfo.data.fiatCurrencyCode, 'USD')} ${myInfo.data.fiatCurrencySymbol})*\n _${imageData.description}_`
        }).join('\n\n');
    }
    await ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
            .text('Back', 'profile')
    });
})

module.exports = bot
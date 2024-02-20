const { Composer } = require('grammy')

const bot = new Composer()

bot.hears('ℹ️ About Bot', async (ctx) => {
    var stats = await db.getStats();
    await ctx.reply(`*🤖 About Bot*\n\nTotal users: ${stats.totalUsers}\nTotal bets made: ${stats.totalBets}\nTotal balance: ${stats.totalBalance}\n\n_This bot was created by @Codinary_`, {
        parse_mode: 'Markdown'
    });
});

module.exports = bot
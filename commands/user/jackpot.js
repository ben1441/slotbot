const { Composer, InputFile, InlineKeyboard } = require("grammy");
const { validateWebAppData } = require("@grammyjs/validator");

const bot = new Composer();

bot.hears("🎰 Play Jackpot", async (ctx) => {
  let url = ctx.request;
  console.log(url);
  //   console.log(validateWebAppData(process.env.BOT_TOKEN, url.searchParams));
  ctx.replyWithPhoto(new InputFile("./cdn/utility/jackpot.jpg"), {
    caption:
      "*Welcome to the jackpot!*\n_Imerse yourself in the world of gambling and win big!_",
    parse_mode: "Markdown",
    reply_markup: new InlineKeyboard().webApp(
      "Play now!",
      `https://slotweb.vercel.app/`
    ),
  });
});

module.exports = bot;

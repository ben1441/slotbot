require("dotenv").config();
const { Bot, session, InputFile, Keyboard, InlineKeyboard } = require("grammy");
const { connect } = require("mongoose");
const { conversations } = require("@grammyjs/conversations");
const { hydrateReply } = require("@grammyjs/parse-mode");
const { hydrateFiles } = require("@grammyjs/files");
const express = require("express");

const log = require("./functions/logger");
const db = require("./functions/database");
const bot = new Bot(process.env.BOT_TOKEN);
const app = new express();
app.use(express.json());

app.post("/webhook", (req, res) => {
  console.log(`[+] New webhook request\n\n${req.body}\n\n`);
  res.status.send("OK");
});

bot.api.config.use(hydrateFiles(bot.token));
bot.use(hydrateReply);
bot.use(
  session({
    initial: () => ({}),
  })
);
bot.use(conversations());

// bot.use(async (ctx, next) => {
//   var user = await db.userExists(ctx.from.id);
//   if (!user) await db.createUser(ctx.from.id);

//   const subadmins = await db.getAdmins();
//   const adminList = [
//     parseInt(process.env.OWNER_ID),
//     ...(subadmins ? subadmins.map((x) => x.telegramId) : []),
//   ];
//   ctx.config = ctx.config || {};
//   ctx.config.adminList = adminList;
//   await next();
// });

// bot.use(require("./commands/admin/admin"));
// bot.use(require("./commands/admin/item"));
// bot.use(require("./commands/admin/user"));
// bot.use(require("./commands/admin/admins"));
// bot.use(require("./commands/user/profile"));
bot.use(require("./commands/user/jackpot"));
bot.use(require("./commands/user/about"));

async function startBot(ctx) {
  await ctx.reply(
    `🎉🎉 Welcome to the Jackpot Bot! 🎉🎉\n\n`,
    // ${
    //   ctx.config.adminList.includes(ctx.from.id)
    //     ? "👑 Welcome back esteemed admin! 👑"
    //     : ""}`,
    {
      reply_markup: new Keyboard()
        .text("🎰 Play Jackpot")
        .row()
        .text("🧑‍💼 Profile")
        .text("ℹ️ About Bot")
        .row()
        .text(
          ""
          //   ctx.config.adminList.includes(ctx.from.id) ? "👮 Admin Panel" : ""
        )
        .resized(),
    }
  );
}

bot.hears(["/start", "🔙 Back to main menu"], startBot);

bot.callbackQuery(
  "cancel",
  (ctx) =>
    ctx.deleteMessage() && ctx.answerCallbackQuery("Operation cancelled!")
);

bot.on(
  "callback_query",
  (ctx) => ctx.answerCallbackQuery("Button timed out!") && ctx.deleteMessage()
);

bot.on(":web_app_data", (ctx) => {
  console.log(ctx);
});

bot.catch((err) => {
  log.error(err);
});

// connect(process.env.MONGO_URI)
//   .then(() => {
//     console.log("Connected to the database");
//     bot.start({
//       drop_pending_updates: true,
//       onStart: (me) => {
//         console.log("Bot started", me.username);
//       },
//     });
//   })
//   .catch((error) => {
//     console.error("Error connecting to the database:", error);
//   });

// bot.command("start", startBot);

bot.start();

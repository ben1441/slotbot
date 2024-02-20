const { Composer, InlineKeyboard, InputFile } = require('grammy')
const { createConversation } = require('@grammyjs/conversations')
const db = require('../../functions/database')
const log = require('../../functions/logger')

const bot = new Composer()

bot.use(createConversation(addItem))

const admin = bot.filter(ctx => ctx.config.adminList.includes(ctx.from.id));

admin.hears('📤 Add item', async ctx => {
    await ctx.conversation.enter('addItem');
})

async function itemPaginator(redirect, callback, params) {
    const array = await db.getItems()
    let dataPerPage = 18

    let keyBoard = new InlineKeyboard()

    array.slice(params * dataPerPage, (params + 1) * dataPerPage).forEach(x => keyBoard.text(`${x.name}`, `${redirect} ${x._id}`))
    keyBoard = keyBoard.toFlowed(2).row()

    //Add next & Back accordingly
    if (params !== 0) keyBoard.text("Back", `${callback} ${params - 1} `);
    if ((params + 1) * dataPerPage < array.length) keyBoard.text("Next", `${callback} ${params + 1} `);
    keyBoard.row()

    //Add page counting
    if (Math.floor(array.length / dataPerPage) > 0) keyBoard.text('Page: ' + (params + 1) + '/' + Math.ceil(array.length / dataPerPage), 'null').row()

    return keyBoard
}

async function viewItems(ctx) {
    if (await db.getItems().length === 0) return ctx[ctx.callbackQuery ? 'editMessageText' : 'reply']('No items found!')
    const keyBoard = await itemPaginator('viewItem', 'viewItems', parseInt(ctx.match[1]) || 0)
    await ctx[ctx.callbackQuery ? 'editMessageText' : 'reply']('Select an item to view:', {
        reply_markup: keyBoard
    })
}

admin.hears('✍️ View items', viewItems)
admin.callbackQuery(/viewItems (.+)/, viewItems)

admin.callbackQuery(/viewItem (.+)/, async ctx => {
    const item = await db.getItems(ctx.match[1])
    await ctx.editMessageText(`*Item*\n\nName: ${item.name}\nDescription: ${item.description}\nPrice: ${item.price}`, {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
            .text('👁️ View Image', `vwImg ${item._id}`).row()
            .text('✍️ Edit Item', `editItem ${item._id}`)
            .text('📥 Remove Item', `rmItem ${item._id}`).row()
            .text('🔙 Back to view items', 'viewItems 0')
    })
})

admin.callbackQuery(/vwImg (.+)/, async ctx => {
    ctx.answerCallbackQuery('Loading image..')
    const item = await db.getItems(ctx.match[1])
    await ctx.replyWithPhoto(new InputFile(item.imagePath), {
        reply_markup: new InlineKeyboard()
            .text('Delete this message', 'nullll')
    })
})

async function removeItem(ctx) {
    if (await db.getItems().length === 0) return ctx[ctx.callbackQuery ? 'editMessageText' : 'reply']('No items found!')
    const keyBoard = await itemPaginator('rmItem', 'removeItem', parseInt(ctx.match[1]) || 0)
    await ctx[ctx.callbackQuery ? 'editMessageText' : 'reply']('Select an item to remove:', {
        reply_markup: keyBoard
    })

}

admin.hears('📥 Remove item', removeItem)
admin.callbackQuery(/removeItem (.+)/, removeItem)

admin.callbackQuery(/rmItem (.+)/, async ctx => {
    const item = await db.getItems(ctx.match[1])
    await ctx.editMessageText(`*Confirmation*\n\nName: ${item.name}\nDescription: ${item.description}\nPrice: ${item.price}\n\nAre you sure you want to remove this item?`, {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
            .text('✅ Confirm', `rmConfirm ${item._id}`)
            .text('❌ Cancel', 'cancel')
    })
})

admin.callbackQuery(/rmConfirm (.+)/, async ctx => {
    await db.removeItems(ctx.match[1])
    await ctx.editMessageText('Item removed successfully!', {
        reply_markup: new InlineKeyboard()
            .text('📥 Remove item', 'removeItem 0')
    })
    await ctx.answerCallbackQuery('Item removed successfully!')
})

async function editItem(ctx) {
    if (await db.getItems().length === 0) return ctx[ctx.callbackQuery ? 'editMessageText' : 'reply']('No items found!')
    const keyBoard = await itemPaginator('edItem', 'editItem', parseInt(ctx.match[1]) || 0)
    await ctx[ctx.callbackQuery ? 'editMessageText' : 'reply']('Select an item to edit:', {
        reply_markup: keyBoard
    })
}

admin.hears('✍️ Edit item', editItem)
admin.callbackQuery(/editItem (.+)/, editItem)

admin.callbackQuery(/edItem (.+)/, async ctx => {
    ctx.session.editItem = ctx.match[1]
    await ctx.conversation.enter('editItem');
})

async function editItemConversation(conversation, ctx) {
    const item = await db.getItems(ctx.session.editItem)
    await ctx.reply(`<b>Please send me the new name for the item<b>\n<blockquote>${item.name}</blockquote>\n Use x or X if you don't want to change the name.`, {
        parse_mode: 'HTML'
    });
    const name = await conversation.form.text()
    if (name.toLowerCase() === 'x') name = item.name
    await ctx.reply('<b>Please send me the new description for the item.</b>\n<blockquote>' + item.description + '</blockquote>\n Use x or X if you don\'t want to change the description.', {
        parse_mode: 'HTML'
    });
    const description = await conversation.form.text()
    if (description.toLowerCase() === 'x') description = item.description
    await ctx.reply('<b>Please send me the new price for the item.</b>\n<blockquote>' + item.price + '</blockquote>\n Use x or X if you don\'t want to change the price.', {
        parse_mode: 'HTML'
    });
    const price = await conversation.form.text()
    if (price === 'x') price = item.price
    if (isNaN(price)) return ctx.reply('Please send a valid price.\n\nProcess stopped')

    await ctx.reply('Now, please send me the new image of the item.\n\nsend x or X to keep the current image.');
    const image = await conversation.waitFor([':photo', ':text'])
    if (image.text.toLowerCase() === 'x') image = item.image

    await ctx.replyWithPhoto(image.msg?.photo[0]?.file_id || image, {
        caption: `*Confirmation*\n\nName: ${name}\nDescription: ${description}\nPrice: ${price}\nImage: Above photo\n\nIs this correct?`,
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
            .text('✅ Confirm', 'confirm')
            .text('❌ Cancel', 'cancel')
    })
    const response = await conversation.waitForCallbackQuery(['confirm', 'cancel'], {
        otherwise: (ctx) => ctx.reply('Please use the buttons to confirm or cancel.', {
            reply_markup: new InlineKeyboard()
                .text('✅ Confirm', 'confirm')
                .text('❌ Cancel', 'cancel')
        })
    })
    response.deleteMessage()
    if (response.callbackQuery.data === 'cancel') return ctx.reply('Item edit cancelled.')

    await ctx.reply('*Loading..*\n_Please wait while I edit the item in the database._', {
        parse_mode: 'Markdown'
    });

    if (image.has(':photo')) {
        const imageInfo = await image.getFile();
        let imagePath = await imageInfo.download(`cdn/items/${imageInfo.file_id}.jpg`);
    }
    const result = await db.editItem(ctx.session.editItem, name, description, price, imagePath || image)
    log.info(result)

    await ctx.reply('Item edited successfully!');
}

async function addItem(conversation, ctx) {
    await ctx.reply('*Item creation*\n\n_Please send me the name of the item._', {
        parse_mode: 'Markdown'
    });
    const name = await conversation.form.text()
    await ctx.reply('Now, please send me the description of the item.');
    const description = await conversation.form.text()
    await ctx.reply('Now, please send me the price of the item.');
    const price = await conversation.form.number()
    await ctx.reply('Now, please send me the image of the item.');
    const image = await conversation.waitFor(':photo')

    await ctx.replyWithPhoto(image.msg.photo[0].file_id, {
        caption: `*Confirmation*\n\nName: ${name}\nDescription: ${description}\nPrice: ${price}\nImage: Above photo\n\nIs this correct?`,
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
            .text('✅ Confirm', 'confirm')
            .text('❌ Cancel', 'cancel')
    })
    const response = await conversation.waitForCallbackQuery(['confirm', 'cancel'], {
        otherwise: (ctx) => ctx.reply('Please use the buttons to confirm or cancel.', {
            reply_markup: new InlineKeyboard()
                .text('✅ Confirm', 'confirm')
                .text('❌ Cancel', 'cancel')
        })
    })
    response.deleteMessage()
    if (response.callbackQuery.data === 'cancel') return ctx.reply('Item creation cancelled.')

    await ctx.reply('*Loading..*\n_Please wait while I add the item to the database._', {
        parse_mode: 'Markdown'
    });

    const imageInfo = await image.getFile();
    const imagePath = await imageInfo.download(`cdn/items/${imageInfo.file_id}.jpg`);

    const result = await db.saveItems(name, description, price, imagePath)
    log.info(result)

    await ctx.reply('Item added successfully!');
}



module.exports = bot
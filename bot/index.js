import { Telegraf } from 'telegraf'
import query from '../src/db'
// require('dotenv').config()
// const keyboard = Markup.inlineKeyboard([
//   Markup.button.url('Ir a la web', 'http://telegraf.js.org'),
//   Markup.button.callback('Change media', 'swap_media')
// ])

const queries = {
  async getTeacherWithToken (token) {
    try {
      const [teacher] = await query(
        'SELECT id, name, email, telegram_token as telegramToken, chat_id as chatId from teachers WHERE telegram_token = ?',
        [token]
      )
      return teacher
    } catch (err) {
      return null
    }
  },
  async validateTeacher ({ teacherId, chatId }) {
    try {
      await query('UPDATE teachers SET valid = ?, chat_id = ? WHERE id = ?', [
        1,
        chatId,
        teacherId
      ])
      return true
    } catch (err) {
      return null
    }
  }
}

const commonReplies = {
  lost (ctx) {
    ctx.reply('*¿Estás perdido?*', { parse_mode: 'MarkdownV2' })
  }
}

const helpers = {
  verifyRole (ctx) {
    if (ctx.chat.id !== process.env.BOT_ADMIN_CHAT_ID) {
      return commonReplies.lost(ctx)
    }
  }
}

const bot = new Telegraf(process.env.BOT_TOKEN)

// Start
bot.start(async ctx => {
  if (!ctx.startPayload) {
    return commonReplies.lost(ctx)
  }
  const teacher = await queries.getTeacherWithToken(ctx.startPayload)
  if (!teacher || teacher.valid || teacher.chatId) {
    return commonReplies.lost(ctx)
  }
  // Welcomes user and ask for email for confirmation
  ctx.reply(
    `
__Bienvenido al bot de *Music & Soul*__

Una vez validada su identidad recibirá notificaciones de la plataforma a través del bot

Por favor ingrese el email de su registro para verificar su identidad

*_Recibirá una respuesta solo si el email es correcto_*
`,
    { parse_mode: 'MarkdownV2' }
  )
  // Bot should hear only the response with the actual teacher email
  bot.hears(new RegExp(teacher.email, 'ig'), async ctx => {
    try {
      await queries.validateTeacher({
        teacherId: teacher.id,
        chatId: ctx.chat.id
      })
      ctx.reply(
        `
Muchas gracias,

Hemos comprobado su identidad *${teacher.name}*
`,
        { parse_mode: 'MarkdownV2' }
      )
    } catch (err) {
      ctx.reply('Tuvimos un error procesando su solicitud')
    }
  })
})

bot.command('get_id', ctx => {
  ctx.reply(ctx.chat.id)
})

bot.action('swap_media', ctx => {
  //   ctx.telegram.sendMessage(ctx.message.chat.id, `swap media babe`);
})

function escapeRegExp (string) {
  return string.replace(/[.+?^$_{}()|[\]\\]/g, '\\$&') // $& means the whole matched string
}

function sendBotMessage (...args) {
  if (args[0]) {
    args[1] = escapeRegExp(args[1])
    // console.log(args[2])
    bot.telegram.sendMessage(...args)
  }
}
// async function main() {
//   const result = await query("SELECT * FROM payments");
//   // bot.telegram.sendMessage("1779392533", JSON.stringify(result), keyboard);
// }
// main();
// setInterval(() => {
// }, 1000);
// bot.help((ctx) => ctx.reply("Send me a sticker you sucker"));
// bot.on("sticker", (ctx) => ctx.reply("👍")); 
// bot.hears("hi", (ctx) => ctx.reply("Hey there"));
bot.launch().then((a) => {
  console.log('Telegram Bot launched')
}).catch(err => {
  console.log(err)
})

export { sendBotMessage }

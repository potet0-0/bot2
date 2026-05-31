const mineflayer = require('mineflayer')
const vec3 = require('vec3')

const options = {
    username: 'Potet62',
    host: 'localhost',
    port: 12312,
}

const bot = mineflayer.createBot(options)

const welcome = () => {
    bot.chat('hiiiii')
}

bot.once('spawn', welcome)


const mineflayer = require('mineflayer')
const vec3 = require('vec3')

const options = {
    username: 'abdullahi',
    host: 'localhost',
    port: 12312,
    version: '1.21.4',
}

const bot = mineflayer.createBot(options)

let killInterval = null

bot.once('spawn', () => {
    bot.chat('aaa')
})

bot.on('chat', async (username, message) => {
  if (username === bot.username) return
  switch (message) {
    case 'loaded':
      await bot.waitForChunksToLoad()
      bot.chat('Ready!')
      break
    case 'list':
      sayItems()
      break
    case 'dig':
      dig()
      break
    case 'build':
      build()
      break
    case 'equip dirt':
      equipDirt()
      break
    case 'forward':
      bot.setControlState('forward', true)
      setTimeout(() => bot.setControlState('forward', false), 2000)
      bot.chat('moving forward')
      break
    case 'sprint toggle':
      if (bot.controlState.sprint) {
        bot.setControlState('sprint', false)
        bot.chat('stop sprinting')
      } else {
        bot.setControlState('sprint', true)
        bot.chat('sprinting!')
      }
      break
    case 'back':
      bot.setControlState('back', true)
      setTimeout(() => bot.setControlState('back', false), 2000)
      bot.chat('moving backwards')
      break
    case 'left':
      bot.setControlState('left', true)
      setTimeout(() => bot.setControlState('left', false), 2000)
      bot.chat('moving left')
      break
    case 'right':
      bot.setControlState('right', true)
      setTimeout(() => bot.setControlState('right', false), 2000)
      bot.chat('moving right')
      break
    case 'attack': {
      const target = bot.nearestEntity(e =>
        e.type === 'mob' ||
        (e.type === 'player' && e.username !== bot.username)
      )
      if (target) {
        bot.lookAt(target.position.offset(0, target.height, 0))
        bot.attack(target)
        bot.chat('attacking ' + (target.username || target.name || target.type))
      } else {
        bot.chat('no target, i have no enemies')
      }
      break
    }
    case 'kill': {
      const target = bot.nearestEntity(e =>
        e.type === 'mob' ||
        (e.type === 'player' && e.username !== bot.username)
      )
      if (target) {
        bot.chat('killing ' + (target.username || target.name || target.type))
        killInterval = setInterval(() => {
          const t = bot.nearestEntity(e =>
            e.type === 'mob' ||
            (e.type === 'player' && e.username !== bot.username)
          )
          if (t) {
            bot.lookAt(t.position.offset(0, t.height, 0))
            bot.setControlState('forward', true)
            bot.attack(t)
          } else {
            clearInterval(killInterval)
            bot.setControlState('forward', false)
            bot.chat('target is dead!')
          }
        }, 500)
      } else {
        bot.chat('nobody to kill')
      }
      break
    }
    case 'stopkill':
      if (killInterval) {
        clearInterval(killInterval)
        killInterval = null
        bot.setControlState('forward', false)
        bot.chat('stopped killing')
        break
      }
      break
    case 'follow':
      const target = bot.nearestEntity(e => e.username === message.split(' ')[1])
      if (target) {
        bot.chat(`following ${target.username}`)
        bot.setControlState('forward', true)
      } else {
        bot.chat('target not found')
      }
  }
})

function sayItems (items = bot.inventory.items()) {
  const output = items.map(itemToString).join(', ')
  if (output) {
    bot.chat(output)
  } else {
    bot.chat('empty')
  }
}

async function dig () {
  let target
  if (bot.targetDigBlock) {
    bot.chat(`already digging ${bot.targetDigBlock.name}`)
  } else {
    target = bot.blockAt(bot.entity.position.offset(0, -1, 0))
    if (target && bot.canDigBlock(target)) {
      bot.chat(`starting to dig ${target.name}`)
      try {
        await bot.dig(target)
        bot.chat(`finished digging ${target.name}`)
      } catch (err) {
        console.log(err.stack)
      }
    } else {
      bot.chat('cannot dig')
    }
  }
}

function build () {
  const referenceBlock = bot.blockAt(bot.entity.position.offset(0, -1, 0))
  const jumpY = Math.floor(bot.entity.position.y) + 1.0
  bot.setControlState('jump', true)
  bot.on('move', placeIfHighEnough)

  let tryCount = 0

  async function placeIfHighEnough () {
    if (bot.entity.position.y > jumpY) {
      try {
        await bot.placeBlock(referenceBlock, vec3(0, 1, 0))
        bot.setControlState('jump', false)
        bot.removeListener('move', placeIfHighEnough)
        bot.chat('Placing a block was successful')
      } catch (err) {
        tryCount++
        if (tryCount > 10) {
          bot.chat(err.message)
          bot.setControlState('jump', false)
          bot.removeListener('move', placeIfHighEnough)
        }
      }
    }
  }
}

async function equipDirt () {
  let itemsByName
  if (bot.supportFeature('itemsAreNotBlocks')) {
    itemsByName = 'itemsByName'
  } else if (bot.supportFeature('itemsAreAlsoBlocks')) {
    itemsByName = 'blocksByName'
  }
  try {
    await bot.equip(bot.registry[itemsByName].dirt.id, 'hand')
    bot.chat('equipped dirt')
  } catch (err) {
    bot.chat(`unable to equip dirt: ${err.message}`)
  }
}

function itemToString (item) {
  if (item) {
    return `${item.name} x ${item.count}`
  } else {
    return '(nothing)'
  }
}
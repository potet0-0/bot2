const mineflayer = require('mineflayer')
const vec3 = require('vec3')
const mineflayerViewer = require('prismarine-viewer').mineflayer
const { pathfinder, Movements } = require('mineflayer-pathfinder')
const { GoalXZ } = require('mineflayer-pathfinder').goals

//if playing locally
// const options = {
//   username: 'slave',
//   host: 'localhost',
//   port: 12312,
//   version: '1.20.4',
// }
//if playing on aternos
 const options = { 
    username: 'slave',
    host: 'potet1231.aternos.me',
    port: 25565,
    version: '1.20.4',
    auth: 'offline'
 }

const bot = mineflayer.createBot(options)

bot.loadPlugin(pathfinder)

let killInterval = null
let followInterval = null

bot.once('spawn', () => {
  bot.chat('aaa')

  mineflayerViewer(bot, { firstPerson: true, port: 3001 })
  console.log('Viewer ready at http://localhost:3001')

  const path = [bot.entity.position.clone()]
  bot.on('move', () => {
    if (path[path.length - 1].distanceTo(bot.entity.position) > 1) {
      path.push(bot.entity.position.clone())
      bot.viewer.drawLine('path', path)
    }
  })

  const mcData = require('minecraft-data')(bot.version)
  const defaultMove = new Movements(bot, mcData)
  bot.pathfinder.setMovements(defaultMove)
})

bot.on('error', err => console.log('[ERR]', err.message))
bot.on('kicked', reason => console.log('[KICKED]', reason))
bot.on('end', reason => console.log('[END]', reason))

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

    case 'jump':
      bot.setControlState('jump', true)
      bot.setControlState('forward', true)
      setTimeout(() => {
        bot.setControlState('jump', false)
        bot.setControlState('forward', false)
      }, 2000)
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
            bot.pathfinder.setGoal(new GoalXZ(t.position.x, t.position.z))
            bot.lookAt(t.position.offset(0, t.height, 0))
            bot.attack(t)
          } else {
            clearInterval(killInterval)
            killInterval = null
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
        bot.pathfinder.setGoal(null)
        bot.chat('stopped killing')
      }
      break
    case 'follow': {
      const target = bot.nearestEntity(e =>
        e.type === 'mob' ||
        (e.type === 'player' && e.username !== bot.username)
      )
      if (target) {
        bot.chat('following ' + (target.username || target.name || target.type))
        followInterval = setInterval(() => {
          const f = bot.nearestEntity(e =>
            e.type === 'mob' ||
            (e.type === 'player' && e.username !== bot.username)
          )
          if (f) {
            bot.pathfinder.setGoal(new GoalXZ(f.position.x, f.position.z))
            bot.lookAt(f.position.offset(0, f.height, 0))
          } else {
            clearInterval(followInterval)
            followInterval = null
            bot.chat('target is dead!')
          }
        }, 500)
      } else {
        bot.chat('nobody to follow')
      }
      break
    }
    case 'stopfollow':
      if (followInterval) {
        clearInterval(followInterval)
        followInterval = null
        bot.pathfinder.setGoal(null)
        bot.chat('stopped following')
      }
      break
    case 'tunnel':
      tunnel()
      break
    case 'goto': {
      const p = bot.entity.position
      bot.pathfinder.setGoal(new GoalXZ(p.x + 20, p.z + 20))
      bot.chat('walking to nearby location!')
      break
    }
    default:
      if (message.startsWith('goto ')) {
        const parts = message.split(' ')
        if (parts.length === 3) {
          const x = parseInt(parts[1])
          const z = parseInt(parts[2])
          bot.pathfinder.setGoal(new GoalXZ(x, z))
          bot.chat('walking to ' + x + ' ' + z)
        } else {
          bot.chat('bad format')
        }
      }
      break

  }
})

function sayItems(items = bot.inventory.items()) {
  const output = items.map(itemToString).join(', ')
  if (output) {
    bot.chat(output)
  } else {
    bot.chat('empty')
  }
}

async function dig() {
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

function build() {
  const referenceBlock = bot.blockAt(bot.entity.position.offset(0, -1, 0))
  const jumpY = Math.floor(bot.entity.position.y) + 1.0
  bot.setControlState('jump', true)
  bot.on('move', placeIfHighEnough)

  let tryCount = 0

  async function placeIfHighEnough() {
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

async function equipDirt() {
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

function itemToString(item) {
  if (item) {
    return `${item.name} x ${item.count}`
  } else {
    return '(nothing)'
  }
}

async function tunnel() {
  for (let i = 0; i < 5; i++) {
    if (bot.targetDigBlock) {
      bot.chat(`already digging ${bot.targetDigBlock.name}`)
    } else {
      const target = bot.blockAt(bot.entity.position.offset(0, -1, 0))
      if (target && bot.canDigBlock(target)) {
        try {
          await bot.dig(target)
          bot.chat(`finished digging ${target.name}`)
          bot.setControlState('forward', true)
          setTimeout(() => bot.setControlState('forward', false), 1000)
        } catch (err) {
          console.log(err.stack)
        }
      } else {
        bot.chat('cannot dig')
      }
    }
  }
}
import { createServer } from "http"
import { Server } from 'socket.io'
import { GameState, createEmptyGame, doAction, Config, Action, determineWinner, filterCardsForPlayerPerspective, Card } from './model'
import express, { NextFunction, Request, Response } from 'express'
import bodyParser from 'body-parser'
import pino from 'pino'
import expressPinoLogger from 'express-pino-logger'
import { Collection, Db, MongoClient, ObjectId } from 'mongodb'
import session from 'express-session'
import MongoStore from 'connect-mongo'
import { BaseClient, Issuer, Strategy, generators } from 'openid-client'
import { Strategy as CustomStrategy } from "passport-custom"
import passport from 'passport'
import { gitlab } from "./secrets"
import { User, GameConfig, RankingEntry } from "./data"
import { error } from "console"
import { setupRedis } from "./redis"


declare module 'express-session' {
  export interface SessionData {
    credits?: number
  }
}

async function main() {

const DISABLE_SECURITY = process.env.DISABLE_SECURITY

const passportStrategies = [
  ...(DISABLE_SECURITY ? ["disable-security"] : []),
  "oidc",
]
  
// set up Mongo
const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017'//'mongodb://localhost:27017'
const client = new MongoClient(mongoUrl)

let db: Db
let userCollection: Collection<User>
let configCollection: Collection<GameConfig>
let gameStateCollection: Collection<GameState>


// customers = db.collection('customers')

// set up Express
const app = express()
const server = createServer(app)
const port = parseInt(process.env.PORT) || 8191
// const port = process.env.PORT || 8228
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// set up Pino logging
const logger = pino({
  transport: {
    target: 'pino-pretty'
  }
})
app.use(expressPinoLogger({ logger }))

// set up CORS
//app.use(cors({
  // origin: "http://127.0.0.1:" + port,
//  origin: 'http://localhost:31000',
//  credentials: true,
//  methods: ['GET', 'POST']
//}))

// set up session
const sessionMiddleware = session({
  secret: 'a just so-so secret',
  resave: false,
  saveUninitialized: true,
  // saveUninitialized: false,
  cookie: { secure: false },

  store: MongoStore.create({
    mongoUrl: mongoUrl, // 'mongodb://localhost:27017',
    ttl: 14 * 24 * 60 * 60 // 14 days
  })
})
app.use(sessionMiddleware)

app.use(passport.initialize())
app.use(passport.session())
passport.serializeUser((user, done) => {
  console.log("serializeUser", user)
  done(null, user)
})
passport.deserializeUser((user, done) => {
  console.log("deserializeUser", user)
  done(null, user)
})


// set up Socket.IO
// const io = new Server(server)
// set up redis
const { socketIoAdapter: adapter } = await setupRedis()
const io = new Server(server, { adapter })

// convert a connect middleware to a Socket.IO middleware
const wrap = (middleware: any) => (socket: any, next: any) => middleware(socket.request, {}, next)
io.use(wrap(sessionMiddleware))

// hard-coded game configuration
//const playerUserIds = ["kl478", "cl653"]
//let playerUserIds: string[] = []

// Default configuration
/*let currentConfig: Config = {
  numberOfDecks: 2,
  rankLimit: 13
}*/
//let config: GameConfig

// Init game state
//let gameState: GameState


io.on('connection', async (client) => {

  const user = (client.request as any).session?.passport?.user

  console.log("on connection ", user)

  let gameState = await gameStateCollection.findOne({ index: 1 })

  if (user) {
    let userState = await userCollection.findOne({userID: user.nickname})

    client.emit("user-state", userState.isReady)
  } else {
    console.log("user not authenticated, disconnect")
    client.disconnect()
    client.leave("gameRoom")
    return
  }

  let playerIndex: number = gameState?.playerNames.indexOf(user.nickname)

  if (typeof playerIndex === "number" && playerIndex >= 0) {
    console.log("client index ", playerIndex)
    client.emit(
      "all-cards",
      filterCardsForPlayerPerspective(Object.values(gameState?.cardsById), playerIndex).filter(card => card.locationType !== "unused"),
    )

    client.emit('game-state', {
      ...gameState,
    })
  }
  /*else {
    client.emit(
      "all-cards",
      gameState ? Object.values(gameState?.cardsById) : null,
    )
  }
  */

  client.on('start-game', async () => {

    logger.info("user " + JSON.stringify(user) + " start game")
    if (!user) {
      client.disconnect()
      client.leave("gameRoom")
      return
    }

    let curPending = await userCollection.find({ isReady: "Pending" }).map((obj: any) => (obj.userID)).toArray()
    console.log("pending user: ", curPending)

    if (!curPending.includes(user.nickname)) {
      curPending.push(user.nickname)
      await userCollection.updateOne({ userID: user.nickname }, { $set: { isReady: "Pending" } })
      console.log("pending user ", user.nickname)

      client.emit("user-state", "Pending")
    }
    const checkIngame = await userCollection.find({ isReady: "InGame" }).map((obj: any) => (obj.userID)).toArray()

    console.log("finish await")
    if (checkIngame.length != 0) {
      // console.log("in game 145: ", checkIngame)
      return
    }
    client.join("gameRoom")

    console.log("current pending users: ", curPending.length)

    const config = await configCollection.findOne({ index: 1 })
    console.log("current config: ", config)

    if (curPending.length >= config.playersInGame) {
      console.log("players reach number")

      curPending = curPending.slice(0, config.playersInGame)

      playerIndex = curPending.indexOf(user.nickname)
        
      let newGameState = createEmptyGame(curPending, config.numberOfDeck, config.rankLimit)

      console.log("current game state: ", newGameState)

      await gameStateCollection.updateOne({ "index": 1 }, {
        "$set": {
          index: 1,
          playerNames: newGameState.playerNames,
          cardsById: newGameState.cardsById,
          currentTurnPlayerIndex: newGameState.currentTurnPlayerIndex,
          phase: newGameState.phase,
          playerScores: newGameState.playerScores,
          playerStopped: newGameState.playerStopped,
          winners: newGameState.winners
        }
      }, { upsert: true })

      // move the player into the game
      for (let addToGame in curPending) {
        console.log("move one player ", curPending[addToGame])
        await userCollection.updateOne({ userID: curPending[addToGame] }, { $set: { isReady: "InGame" } })
      }
      io.to("gameRoom").emit("user-state", "InGame")
      await broadcastGameState()
    }

  }
  )

  async function emitUpdatedCardsForPlayers(cards: Card[], newGame = false) {
    let gameState = await gameStateCollection.findOne({ index: 1 })

    gameState.playerNames.forEach((_, i) => {
      let updatedCardsFromPlayerPerspective = filterCardsForPlayerPerspective(cards, i)
      if (newGame) {
        updatedCardsFromPlayerPerspective = updatedCardsFromPlayerPerspective.filter(card => card.locationType !== "unused")
      }
      console.log("emitting update for player", i, ":", updatedCardsFromPlayerPerspective)
      client.emit(
        newGame ? "all-cards" : "updated-cards",
        updatedCardsFromPlayerPerspective,
      )
    })
  }


  // broadcast the game state to all players
  async function broadcastGameState() {
    gameState = await gameStateCollection.findOne({ index: 1 })
    const config = await configCollection.findOne({ index: 1 })
    const winners = gameState?.phase === 'game-over' ? determineWinner(gameState, config) : []
    io.to("gameRoom").emit('game-state', {
      ...gameState,
      winners,
      playerScores: gameState.playerScores,
    })
    console.log("emit game state", gameState.currentTurnPlayerIndex)
  }

  async function endGame() {
    gameState = await gameStateCollection.findOne({ index: 1 })

    if (!gameState) {
      console.log('No game state found to end the game')
      return;
    }

    const config = await configCollection.findOne({ index: 1 })
    const winners = gameState?.phase === 'game-over' ? determineWinner(gameState, config) : [];


    // increment number of games for all player
    await userCollection.updateMany(
      { userID: { $in: gameState.playerNames } },
      { $inc: { numberOfGames: 1 } }
    )

    // Update wins
    if (winners.length > 0) {
      await userCollection.updateMany(
        { userID: { $in: winners } },
        { $inc: { winGames: 1 } }
      );
    }

    for (let players in gameState.playerNames) {
      console.log("set end game for ", gameState.playerNames[players])
      await userCollection.updateOne({ userID: gameState.playerNames[players] }, { $set: { isReady: "NotInGame" } })
    }

    io.to("gameRoom").emit("user-state", "NotInGame")
    gameState = null
    io.socketsLeave("gameRoom")
    await gameStateCollection.findOneAndDelete({ index: 1 })

    io.emit("game-ended")
  }

  client.on('action', async (action: Action) => {
    gameState = await gameStateCollection.findOne({ index: 1 })

    playerIndex = gameState?.playerNames.indexOf(user.nickname)
    if (playerIndex == -1) {
      return
    }
    console.log("action by ", playerIndex)

    if (typeof playerIndex === "number") {

      console.log(`Action received from client ${client.id}:`, action)

      const changedCards = doAction(gameState, action)

      if (changedCards.length > 0) {
        // If action was successful
        emitUpdatedCardsForPlayers(changedCards)

        changedCards.forEach(card => console.log(`Card changed: ${(card.id)}`))
      } else {
        console.log('Action was not valid or could not be processed')
      }

    } else {
      // no actions allowed from "all"
    }

    await gameStateCollection.updateOne({ "index": 1 }, {
      "$set": {
        playerNames: gameState.playerNames,
        cardsById: gameState.cardsById,
        currentTurnPlayerIndex: gameState.currentTurnPlayerIndex,
        phase: gameState.phase,
        playerScores: gameState.playerScores,
        playerStopped: gameState.playerStopped,
        winners: gameState.winners
      }
    }, { upsert: true })

    const config = await configCollection.findOne({ index: 1 })
    const winners = gameState.phase === 'game-over' ? determineWinner(gameState, config) : []

    io.to("gameRoom").emit('game-state', {
      playerIndex: null,
      ...gameState,
      winners,
      playerScores: gameState.playerScores,
    })

    console.log("current game phase ", gameState?.phase)
    if (gameState?.phase === 'game-over') {
      console.log("Game is ended!")
      await endGame()
    }
  })

  // let playerIndex: number | null | "all" = null
  // client.on('player-index', n => {
  //   playerIndex = n
  //   console.log("playerIndex set", n)
  //   client.join(String(n))
  //   if (typeof playerIndex === "number") {
  //     client.emit(
  //       "all-cards",
  //       filterCardsForPlayerPerspective(Object.values(gameState.cardsById), playerIndex).filter(card => card.locationType !== "unused"),
  //     )
  //   } else {
  //     client.emit(
  //       "all-cards",
  //       Object.values(gameState.cardsById),
  //     )
  //   }
  // })

  // client.on('new-game', () => {
  //   gameState = createEmptyGame(gameState.playerNames, currentConfig.numberOfDecks, currentConfig.rankLimit)
  //   broadcastGameState()
  // })


  // client.on('update-config', (config: Partial<Config>) => {
  //   if (config.numberOfDecks !== undefined) {
  //     currentConfig.numberOfDecks = config.numberOfDecks
  //   }
  //   if (config.rankLimit !== undefined) {
  //     currentConfig.rankLimit = config.rankLimit
  //   }
  //   console.log('Game configuration updated:', currentConfig)
  //   client.emit('config-updated', currentConfig) 
  // })

  client.on('disconnect', async () => {
    console.log('Client disconnected:', client.id)

    gameState = await gameStateCollection.findOne({index: 1})

    if (!gameState || !gameState.playerNames.includes(user.nickname)) { return }
    io.to("gameRoom").emit('game-state', {
      ...gameState,
      phase: "game-over"
    })

    if (gameState.playerNames.includes(user.nickname)) {
      endGame()
    }
    await userCollection.updateOne({ userID: user.nickname }, { $set: { isReady: "NotInGame" } })
  })
})

// server.listen(port)
// console.log(`Game server listening on port ${port}`)


// app routes
app.post(
  "/api/logout",
  (req, res, next) => {
    req.logout((err) => {
      if (err) {
        return next(err)
      }
      res.redirect("/")
    })
  }
)

app.get("/api/user", (req, res) => {
  res.json(req.user || {})
})

// connect to Mongo
client.connect().then(() => {
  logger.info('connected successfully to MongoDB')
  db = client.db("test")
  const user: User = {
    userID: "test",
    role: "Admin",
    numberOfGames: 0,
    winGames: 0,
    isReady: "NotInGame",
    winRate: 0
  }

  userCollection = db.collection('users')
  configCollection = db.collection('configuration')
  gameStateCollection = db.collection('gameState')

  // test for ranking !!!
  userCollection.insertOne({
    userID: "admin",
    role: "Admin",
    numberOfGames: 10,
    winGames: 8,
    isReady: "NotInGame",
    winRate: 0
  })

  userCollection.insertOne({
    userID: "user1",
    role: "Player",
    numberOfGames: 22,
    winGames: 10,
    isReady: "NotInGame",
    winRate: 0
  })

  userCollection.insertOne({
    userID: "user2",
    role: "Player",
    numberOfGames: 25,
    winGames: 3,
    isReady: "NotInGame",
    winRate: 0
  })

  userCollection.insertOne({
    userID: "user3",
    role: "Player",
    numberOfGames: 30,
    winGames: 7,
    isReady: "NotInGame",
    winRate: 0
  })


  configCollection.findOne({ index: 1 }).then(async (result: any) => {
    console.log("result: ", result)
    if (result == null) {
      await configCollection.insertOne({
        index: 1,
        totalPoints: 24,
        numberOfDeck: 1,
        rankLimit: 13,
        playersInGame: 1
      })
      console.log("insert default game config")
    }
  })

  passport.use("disable-security", new CustomStrategy((req: any, done: any) => {
    if (req.query.key !== DISABLE_SECURITY) {
      console.log("you must supply ?key=" + DISABLE_SECURITY + " to log in via DISABLE_SECURITY")
      done(null, false)
    } else {
      done(null, { name: req.query.user, nickname: req.query.user, groups: [].concat(req.query.group) })
    }
  }))



  Issuer.discover("https://coursework.cs.duke.edu/").then(issuer => {
    const client = new issuer.Client(gitlab)

    const params = {
      scope: 'openid profile email',
      nonce: generators.nonce(),
      redirect_uri: 'http://localhost:31000/login-callback',
      // redirect_uri: 'http://localhost:8221/login-callback',
      state: generators.state(),
    }

    function verify(tokenSet: any, userInfo: any, done: (error: any, user: any) => void) {
      console.log('userInfo', userInfo)
      console.log('tokenSet', tokenSet)

      async function addData() {
        const netid = userInfo.nickname
        const check = await userCollection.findOne({ userID: netid })
        if (check == null) {
          console.log("save data")
          let role: "Admin" | "Player"
          if (userInfo.groups.includes("gameAdmin")) {
            role = "Admin"
          } else if (userInfo.groups.includes("gamePlayer")) {
            role = "Player"
          } else {
            return done(null, false)
          }

          let isReady: "NotInGame" | "Pending" | "InGame" = "NotInGame"

          await userCollection.insertOne({
            userID: netid,
            role: role,
            numberOfGames: 0,
            winGames: 0,
            isReady: isReady,
            winRate: 0
          })
        }
        return done(null, userInfo)
      }
      return addData()

      // return done(null, userInfo)
    }

    passport.use('oidc', new Strategy({ client, params }, verify))

    app.get(
      "/api/login",
      passport.authenticate(passportStrategies, { failureRedirect: "/api/login" }),
      (req, res) => res.redirect("/rule")
    )

    app.get(
      "/login-callback",
      passport.authenticate(passportStrategies, {
        successRedirect: "/rule",
        failureRedirect: "/",
      }),
      (req, res) => res.redirect("/rule")
    )

    app.get(
      "/api/get-game-config", async (req, res) => {
        if (!req.isAuthenticated() || !req.user) {
          res.status(401).send("User not authenticated");
          return;
        }
        const data = await configCollection.findOne({ index: 1 })
        res.json(data)
      }
    )

    app.get("/api/get-player", async (req, res) => {
      if (!req.isAuthenticated() || !req.user) {
        res.status(401).send("User not authenticated");
        return;
      }

      const userID = (req.user as any).nickname
      console.log("Fetch the user with userID:", userID)
      try {
        const playerData = await userCollection.findOne({ userID: userID });
        if (!playerData) {
          res.status(404).send("Player not found");
        } else {
          res.json({
            name: playerData.userID, 
            numberOfGames: playerData.numberOfGames,
            winGames: playerData.winGames,
            winRate: playerData.numberOfGames > 0 ? (playerData.winGames / playerData.numberOfGames * 100) : 0,
          })
        }
      } catch (error) {
        console.error("Error fetching player data: ", error)
        res.status(500).send("Internal Server Error")
      }
    })

    app.get('/api/ranking', async (req, res) => {
      if (!req.isAuthenticated() || !req.user) {
        res.status(401).send("User not authenticated");
        return;
      }
      try {
        const ranking = await userCollection.find({}).sort({ winGames: -1 }).toArray()

        console.log("Found ranking is", ranking)
    
        const rankingEntries: RankingEntry[] = ranking.map((user: User, index: number) => ({
          rank: index + 1,
          name: user.userID, 
          wins: user.winGames
        }))

        console.log("rankingEntries is ", rankingEntries)
    
        res.json(rankingEntries);
      } catch (error) {
        console.error('Failed to get rankings:', error);
        res.status(500).send('Internal Server Error');
      }
    })
    

    app.post(
      "/api/update-config", async (req, res) => {
        if (!req.isAuthenticated() || !req.user) {
          res.status(401).send("User not authenticated");
          return;
        }
        const playerData = await userCollection.findOne({ userID: (req.user as any).nickname });
        if (playerData.role != "Admin"){
          res.status(401).send("Not Admin User");
          return;
        }
        console.log("config request: ", req.body)
        const data = await configCollection.updateOne({ "index": 1 }, {
          "$set": {
            totalPoints: req.body.totalPoints,
            numberOfDeck: req.body.numberOfDeck,
            rankLimit: req.body.rankLimit,
            playersInGame: req.body.playersInGame
          }
        }, { upsert: true })

        console.log("Change config then make all pending players not in game")
    

        await userCollection.updateMany({isReady: "Pending"}, {
          "$set": {
            isReady: "NotInGame"
          }
        })
        res.json()
      }
    )

    /*
    app.get(
      "/api/start",
      async (req, res) => {
        const data = await configCollection.findOne({ index: 1 })
        config = {
          index: data.index,
          totalPoints: data.totalPoints,
          numberOfDeck: data.numberOfDeck,
          rankLimit: data.rankLimit,
          playersInGame: data.playersInGame
        }
        playerUserIds.push((req.user as any).nickname)
        res.json()
      }
    )
    */

    // start server
    server.listen(port)
    logger.info(`Game server listening on port ${port}`)
  })
})
}

main().catch(console.error)
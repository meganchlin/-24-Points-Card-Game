<template >
  <div class= "text-center">
  </div>
  <b-overlay v-bind:z-index="0" :show="state == 'Pending' || state == 'NotInGame'">
    
    <template #overlay>
      <b-button v-if="state == 'NotInGame'" @click="startGame">Start Game</b-button>
      <b-spinner v-if="state == 'Pending'" big type="border" variant="secondary"></b-spinner>
      <p v-if="state == 'Pending'">Please wait for more players to join in...</p>
    </template>

    <div class="status">
      <b-badge variant="info"> {{ phase }}</b-badge>
      <b-badge variant="info">Your Score: {{ myScore }}</b-badge>
    </div>
    <div class="cards-container">
      <AnimatedCard v-for="card in myCards" :key="card.id" :card="card" />
    </div>
    <div class="actions">
      <b-button variant="primary" @click="drawCard" :disabled="!myTurn || gameEnded">Draw Card</b-button>
      <b-button variant="danger" @click="stopDrawing" :disabled="!myTurn || gameEnded">Stop Drawing</b-button>
    </div>
  </b-overlay>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, Ref, provide } from 'vue'
import { io } from "socket.io-client"
import AnimatedCard from '../components/AnimatedCard.vue'
// import { Card, Action } from "../../server/model.ts"

import { Card, Action } from '../../model'
// props
// interface Props {
//   playerIndex?: string
// }

// default values for props
// const props = withDefaults(defineProps<Props>(), {
//   playerIndex: "all",
// })
const socket = io({ transports: ["websocket"] })
//const socket = io()
// let x = props.playerIndex
const state = ref("NotInGame")
const playerIndex = ref<number>(-1)
// console.log("playerIndex", JSON.stringify(playerIndex))
// socket.emit("player-index", playerIndex)

// const cards: Ref<Card[]> = ref([])

const currentTurnPlayerIndex = ref(-1)
const phase = ref("")
const gameState = ref({})
const myScore = ref(0)
const winners: Ref<string[]> = ref([])
// const myCards = ref([])
const myCards = ref<Card[]>([])

const myTurn = computed(() => currentTurnPlayerIndex.value === playerIndex.value && phase.value !== "game-over")

const gameEnded = computed(() => phase.value === 'game-over')

const user = ref({} as any)
provide("user", user)

onMounted(async () => {
  user.value = await (await fetch("/api/user")).json()
})

async function startGame(){
  /*
  showOverlay.value = false
  fetch(
    "/api/start"
  ).then(()=> alert("start game"))
  */
  socket.emit("start-game")
  state.value = "Pending"
}



// Only show the cards belonging to the player
// const myCards = computed(() => Object.values(gameState.value.cardsById || {}).filter(card => card.playerIndex === props.playerIndex))

socket.on("user-state", (newState: string) => {
  state.value = newState
})

socket.on("all-cards", (allCards: Card[]) => {
  myCards.value = allCards
})

socket.on("updated-cards", (updatedCards: Card[]) => {
  applyUpdatedCards(updatedCards)
})

socket.on("game-ended", () => {
  if (state.value == "Pending") {
    alert("Previous game ended, start game!")
    socket.emit("start-game")
  }
})

socket.on("game-state", (newGameState) => {
  // alert("game state receive")
  //pending.value = false

  playerIndex.value = newGameState.playerNames.indexOf(user.value.nickname)

  gameState.value = newGameState
  currentTurnPlayerIndex.value = newGameState.currentTurnPlayerIndex
  phase.value = newGameState.phase
  myScore.value = newGameState.playerScores[playerIndex.value]
  winners.value = newGameState.winners || []
  // playerIndex.value = newGameState.playerIndex

  if (gameEnded.value) {
    console.log(user.value.userID)
    if (winners.value.includes(user.value.nickname)){
      alert("You won! Game Ended!")
    } else {
      alert("You lose! Game Ended!")
    }

    state.value = "NotInGame"
    playerIndex.value = -1
    myScore.value = 0
    myCards.value = []
    phase.value = ""
    winners.value = []
  }

})

function doAction(action: Action) {
  return new Promise<Card[]>((resolve) => {
    socket.emit("action", action)
    socket.once("updated-cards", (updatedCards: Card[]) => {
      resolve(updatedCards)
    })
  })
}

async function drawCard() {
  if (typeof playerIndex.value === "number") {
    await doAction({ action: "draw-card", playerIndex: playerIndex.value })
  }
}

async function applyUpdatedCards(updatedCards: Card[]) {
  for (const x of updatedCards) {
    const existingCard = myCards.value.find(y => x.id === y.id)
    if (existingCard) {
      Object.assign(existingCard, x)
    } else {
      myCards.value.push(x)
    }
  }
}

function stopDrawing() {
  if (myTurn.value) {
    socket.emit("action", { action: "stop-drawing", playerIndex: playerIndex.value })
  }
}


</script>


<style scoped>
.game-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.actions {
  margin-bottom: 20px;
}

.cards-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

/*
.text-center {
  position: absolute;
  margin: auto;
  z-index: 5;
}*/
</style>

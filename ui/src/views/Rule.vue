<template>
  <b-container class="my-5">
    <b-row>
      <b-col>
        <h1 class="text-center mb-4"> {{ totalPoints }} Points Game Rules </h1>
        <b-card>
          <h2>Objective</h2>
          <p>Draw cards to get as close as possible to {{ totalPoints }} points.</p>

          <h2>Setup</h2>
          <ul>
            <li>Players: {{ playersInGame }}.</li>
            <li>Number of Deck: {{ deckNum }} </li>
            <li>Each Deck: Standard 52 cards.</li>
            <li>Rank Limit: {{ rankLimit }}.</li>
          </ul>

          <h2>Values</h2>
          <ul>
            <li>A=1, 2-10 as face value</li>
            <li>J=11</li>
            <li>Q=12</li>
            <li>K=13</li>
          </ul>

          <h2>How to Play</h2>
          <ol>
            <li>Draw Cards: Take turns drawing cards. Stop anytime.</li>
            <li>Aim: Use addition to combine card values aiming for {{ totalPoints }}.</li>
            <li>Ending the Game: The game round ends when all players decide to stop drawing cards.</li>
          </ol>

          <h2>Winning</h2>
          <p>Closest to {{ totalPoints }} without going over wins. In a multiplayer setup, ties share victory or draw
            one more card each for a tiebreak.</p>
        </b-card>
      </b-col>
    </b-row>
  </b-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { BContainer, BRow, BCol, BCard } from 'bootstrap-vue'


const totalPoints = ref(0)
const playersInGame = ref(0)
const deckNum = ref(0)
const rankLimit = ref(0)


onMounted(async () => {
  // Fetch game config from the server
  try {
    const response = await fetch('/api/get-game-config')
    if (!response.ok) {
      throw new Error('Failed to fetch game configuration')
    }
    const gameConfig = await response.json()
    totalPoints.value = gameConfig.totalPoints
    playersInGame.value = gameConfig.playersInGame
    deckNum.value = gameConfig.numberOfDeck
    rankLimit.value = gameConfig.rankLimit
  } catch (error) {
    console.error(error)
  }
})


</script>

<template>
  <div v-if="user?.groups?.includes('gameAdmin')">
  <h1>Game Config</h1>
  <b-form>
    <b-form-group label="Total Points:">
      <b-form-input v-model="config.totalPoints" number></b-form-input>
    </b-form-group>
    <b-form-group label="Number Of Deck:">
      <b-form-input v-model="config.numberOfDeck" number></b-form-input>
    </b-form-group>
    <b-form-group label="Rank Limit:">
      <b-form-input v-model="config.rankLimit" number></b-form-input>
    </b-form-group>
    <b-form-group label="Number Of Players In A Game:">
      <b-form-input v-model="config.playersInGame" number></b-form-input>
    </b-form-group>
  </b-form>
  <b-button @click="updateGameConfig">Update Config</b-button>
</div>
</template>

<script setup lang="ts">
import { onMounted, ref, Ref, provide } from 'vue'
import { GameConfig } from '../../data.ts'

const config: Ref<GameConfig> = ref({} as GameConfig)

const user = ref({} as any)
provide("user", user)

onMounted(async () => {
  user.value = await (await fetch("/api/user")).json()
  config.value = await (await fetch(
    "/api/get-game-config"
  )).json()
})

function updateGameConfig() {
  fetch(
    "/api/update-config",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(config.value),
    }
  ).then(() => alert('Game configuration updated successfully'))
}

</script>

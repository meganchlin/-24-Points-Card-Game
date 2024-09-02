<template>
  <b-card class="profile-card" header="User Profile" header-tag="header">
    <b-container class="text-center">
      <b-row class="mb-2">
        <b-col>
          <b-avatar :src="user.picture" size="6rem"></b-avatar>
        </b-col>
      </b-row>
      <b-row>
        <b-col>
          <h3>{{ user.nickname }}</h3>
        </b-col>
      </b-row>
      <b-row>
        <b-col>
          <b-row class="mb-1">
            <b-col>Winnings</b-col>
            <b-col><strong>{{ player.winGames }} games</strong></b-col>
          </b-row>
          <b-row class="mb-1">
            <b-col>Total Games</b-col>
            <b-col><strong>{{ player.numberOfGames }} games</strong></b-col>
          </b-row>
          <b-row class="mb-3">
            <b-col>Win Rate</b-col>
            <b-col><strong>{{ winRateFixed }}%</strong></b-col>
          </b-row>
          <b-progress :value="player.winRate" max="100" show-progress animated class="custom-progress-bar"></b-progress>
        </b-col>
      </b-row>
    </b-container>
  </b-card>
</template>

<script setup lang="ts">
import { onMounted, ref, provide, Ref, computed } from 'vue'
import { User } from '../../data.ts'

const player: Ref<User> = ref({} as User)

const user = ref({} as any)
provide("user", user)

onMounted(async () => {
  user.value = await (await fetch("/api/user")).json()
  player.value = await (await fetch("/api/get-player")).json()
})

// const winRateFixed = computed(() => {
//   return player.value.winRate ? player.value.winRate.toFixed(2) : '0.00';
// })

const winRateFixed = computed(() => {
  return player.value.winRate ? Math.round(player.value.winRate).toString() : '0';
})

</script>

<style scoped>
.profile-card {
  max-width: 400px;
  margin: auto;
}

:deep(.custom-progress-bar) .progress-bar {
  background-color: rgb(216, 133, 163) !important;
}
</style>

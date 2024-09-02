<template>
  <b-container class="my-5">
    <b-row>
      <b-col>
        <h1 class="text-center mb-4">Player Rankings</h1>
        <b-table striped hover :items="rankings" :fields="fields">
          <template #cell(name)="data">
            {{ (data as any).item.name }}
          </template>
        </b-table>
      </b-col>
    </b-row>
  </b-container>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { BTable, BContainer, BRow, BCol } from 'bootstrap-vue'
import { RankingEntry } from '../../data.ts'

const rankings = ref<RankingEntry[]>([])

const fields = [
  'rank',
  { key: 'name', sortable: true } ,
  { key: 'wins', sortable: true }
]

onMounted(async () => {
  try {
    const response = await fetch('/api/ranking') 
    if (!response.ok) {
      throw new Error('Failed to fetch rankings')
    }
    const rankingData = await response.json()
    rankings.value = rankingData 
  } catch (error) {
    console.error(error)
  }
})
</script>

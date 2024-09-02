<template>
    <div class="animated-card">
        <div class="card-id">[{{ card!.id }}]</div>
        <div class="card-info">
            <div class="card-rank">{{ card!.rank }}</div>
            <div class="card-suit">{{ card!.suit }}</div>
        </div>
    </div>
</template>

<script setup lang="ts">
// import { computed } from 'vue'
import { Card } from '../../model'

// defineProps({
//     card: Card
// })

// props
interface Props {
  card?: Card
}

withDefaults(defineProps<Props>(), {
  card: undefined,
})



</script>

<style scoped>
.animated-card {
    display: inline-block;
    border: 2px solid #ccc;
    border-radius: 8px;
    padding: 10px;
    margin: 5px;
    text-align: center;
    background-color: white;
    transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
    cursor: pointer;
}

.card-id {
    font-size: 12px;
    color: #1b1a1ab5;
    margin-bottom: 8px;
}

.card-info {
    font-size: 16px;
    font-weight: bold;
}

.card-rank,
.card-suit {
    display: block;
}

.card-suit {
    font-size: 24px;
}

</style>

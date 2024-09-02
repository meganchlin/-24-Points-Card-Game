<template>
  <div>
    <b-navbar toggleable="lg" type="dark" :variant="user?.name != null ? 'info' : 'primary'">
      <b-navbar-brand href="#">
        <span v-if="user?.name">Welcome, {{ user.nickname }}</span>
        <span v-else>Card Game</span>
      </b-navbar-brand>
      <b-navbar-nav>
        <b-nav-item v-if="user?.name == null" href="/api/login">Login</b-nav-item>
        <b-nav-item v-if="user?.name" @click="logout">Logout</b-nav-item>
        <form method="POST" action="/api/logout" id="logoutForm" />
      </b-navbar-nav>
    </b-navbar>
    <div v-if="user?.name">
      <b-navbar toggleable="lg" type="dark" :variant="user?.name != null ? 'info' : 'primary'">
        <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>
        <b-collapse id="nav-collapse" is-nav>
          <b-navbar-nav>
            <!-- <b-nav-item href="/scrollable">Scrollable</b-nav-item>
            <b-nav-item href="/positioning">Positioning</b-nav-item> -->
            <b-nav-item v-if="user?.name" href="/rule">Rule</b-nav-item>
            <b-nav-item v-if="user?.name" href="/game">Game</b-nav-item>
            <b-nav-item v-if="user?.name" href="/profile">UserProfile</b-nav-item>
            <b-nav-item v-if="user?.name" href="/ranking">Ranking</b-nav-item>
            <b-nav-item v-if="user?.groups?.includes('gameAdmin')" href="/config">GameConfig</b-nav-item>
          </b-navbar-nav>
        </b-collapse>
      </b-navbar>
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, provide } from 'vue'
// import { BvModalEvent } from 'bootstrap-vue'
// import { getCurrentInstance } from 'vue'

const user = ref({} as any)
provide("user", user)

onMounted(async () => {
  user.value = await (await fetch("/api/user")).json()
})

function logout() {
  ; (window.document.getElementById('logoutForm') as HTMLFormElement).submit()
}

//const navBarVariant = ref("primary")

/*
function handleCancel(bvModalEvent: BvModalEvent) {
  // an unfortunate but necessary hack to allow 
  // $-style BootstrapVue APIs to be called from Vue 3 and above
  const { $bvModal } = (getCurrentInstance()!.proxy) as any

  bvModalEvent.preventDefault()
  $bvModal.msgBoxOk("Sorry, we didn't implement cancel correctly!")
}*/
</script>
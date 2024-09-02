import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { BootstrapVue, BootstrapVueIcons } from 'bootstrap-vue'

import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

import App from './App.vue'
import Game from './views/Game.vue'
import Config from './views/Config.vue'
import Profile from './views/Profile.vue'
import Ranking from './views/Ranking.vue'
import Rule from './views/Rule.vue'

const routes = [
	{
		path: "/rule",
		component: Rule,
	},
	{
		path: "/game",
		component: Game,
		// props (route) {
		// 	return {
		// 		playerIndex: route.params.playerIndex
		// 	}
		// }
	},
	{
		path: "/config",
		component: Config,
	},
	{
		path: "/profile",
		component: Profile,
	}
	,
	{
		path: "/ranking",
		component: Ranking,
	}
]

const router = createRouter({
	history: createWebHistory(),
	routes,
})

createApp(App)
	.use(BootstrapVue  as any)
	.use(BootstrapVueIcons  as any)
	.use(router)
	.mount('#app')

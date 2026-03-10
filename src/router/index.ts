import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home/index.vue')
  },
  {
    path: '/forum',
    name: 'Forum',
    component: () => import('@/views/Forum/index.vue')
  },
  {
    path: '/thread/:tid',
    name: 'Thread',
    component: () => import('@/views/Thread/index.vue'),
    props: true
  },
  {
    path: '/user/:authorId',
    name: 'UserThreads',
    component: () => import('@/views/UserThreads/index.vue'),
    props: true
  },
  {
    path: '/search',
    name: 'Search',
    component: () => import('@/views/Search/index.vue')
  },
  {
    path: '/post',
    name: 'Post',
    component: () => import('@/views/Post/index.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Cookie/index.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router

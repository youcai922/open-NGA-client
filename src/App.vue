<template>
  <router-view v-slot="{ Component, route }">
    <keep-alive :include="['Forum', 'Search']">
      <component :is="Component" :key="route.name" />
    </keep-alive>
  </router-view>
</template>

<script setup lang="ts">
// App root component
</script>

<style>
html,
body,
#app {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

#app {
  font-family: 'Microsoft YaHei', 'PingFang SC', -apple-system, BlinkMacSystemFont, 'Segoe UI',
    Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>

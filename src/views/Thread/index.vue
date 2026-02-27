<template>
  <div class="thread-container h-full flex flex-col">
    <div class="thread-header h-12 flex-center bg-gray-100 border-b">
      <h2 class="text-lg font-semibold">主题列表</h2>
    </div>
    <div class="thread-content flex-1 overflow-auto p-4">
      <el-empty description="暂无主题数据" />
    </div>
  </div>
</template>

<script setup lang="ts">
// Thread page
</script>

<style scoped>
.thread-container {
  background: #f5f5f5;
}
</style>

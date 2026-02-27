<template>
  <div class="post-container h-full flex flex-col">
    <div class="post-header h-12 flex-center bg-gray-100 border-b">
      <h2 class="text-lg font-semibold">帖子详情</h2>
    </div>
    <div class="post-content flex-1 overflow-auto p-4">
      <el-empty description="暂无帖子数据" />
    </div>
  </div>
</template>

<script setup lang="ts">
// Post page
</script>

<style scoped>
.post-container {
  background: #f5f5f5;
}
</style>

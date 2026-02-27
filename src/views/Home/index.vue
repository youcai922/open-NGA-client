<template>
  <div class="home-container">
    <div class="home-card">
      <div class="logo-area">
        <h1 class="app-title">open-NGA-client</h1>
        <p class="app-subtitle">NGA 论坛本地桌面客户端</p>
      </div>

      <div class="action-area">
        <el-button type="primary" size="large" @click="goToForum" class="action-btn">
          进入论坛
        </el-button>
        <el-button size="large" @click="goToCookie" class="action-btn">
          Cookie 设置
        </el-button>
      </div>

      <div class="status-area">
        <el-tag :type="cookieStore.getStatusType() as any" size="large">
          {{ cookieStore.getStatusText() }}
        </el-tag>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCookieStore } from '@/stores/cookie'
import { ngaApiRequest } from '@/api/nga'

const router = useRouter()
const cookieStore = useCookieStore()

const goToForum = () => {
  router.push('/forum')
}

const goToCookie = () => {
  router.push('/cookie')
}

// 启动时初始化并自动测试连接
onMounted(async () => {
  await cookieStore.init()
  if (cookieStore.hasCookie()) {
    try {
      const response = await ngaApiRequest.getThreadList({
        fid: '-7955747',
        page: '1',
      })
      if (response.success) {
        cookieStore.setConnectionStatus('connected')
      } else {
        cookieStore.setConnectionStatus('set')
      }
    } catch {
      cookieStore.setConnectionStatus('set')
    }
  }
})
</script>

<style scoped>
.home-container {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 50%, #fef3c7 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.home-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  padding: 48px 64px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 360px;
}

.logo-area {
  text-align: center;
  margin-bottom: 40px;
}

.app-title {
  font-size: 28px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 12px 0;
  letter-spacing: -0.5px;
}

.app-subtitle {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

.action-area {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  margin-bottom: 32px;
}

.action-btn {
  width: 100%;
  height: 44px;
  font-size: 15px;
  border-radius: 12px;
}

.status-area {
  padding-top: 24px;
  border-top: 1px solid #e2e8f0;
  width: 100%;
  display: flex;
  justify-content: center;
}
</style>

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
        <el-button
          v-if="!cookieStore.hasCookie()"
          type="success"
          size="large"
          @click="openLoginPage"
          class="action-btn"
        >
          官网登录
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
import { ElMessage } from 'element-plus'
import { invoke } from '@tauri-apps/api/core'

const router = useRouter()
const cookieStore = useCookieStore()

const goToForum = () => {
  router.push('/forum')
}

const goToCookie = () => {
  router.push('/cookie')
}

// 打开官网登录页（应用内窗口）
const openLoginPage = async () => {
  try {
    await invoke('open_login_window')
    ElMessage({
      message: '请在弹出的窗口中登录 NGA 论坛，登录后返回此页面到 Cookie 设置',
      type: 'success',
      duration: 5000,
      showClose: true,
    })
    // 延迟跳转到 Cookie 设置页
    setTimeout(() => {
      router.push('/cookie')
    }, 3000)
  } catch (error) {
    console.error('打开登录窗口失败:', error)
    ElMessage.error('打开登录窗口失败: ' + (error as string))
  }
}

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

/* 核心修复：彻底重置 el-button 所有内置布局样式 */
.action-btn {
  width: 100%;
  height: 48px;
  font-size: 15px !important; /* 强制统一文字大小 */
  border-radius: 12px;
  /* 1. 清空所有内置 padding/margin，彻底抹平类型差异 */
  padding: 0 !important;
  margin: 0 !important;
  /* 2. 取消组件自带的文字对齐逻辑 */
  text-align: center !important;
  /* 3. 保留按钮的基础样式（主题色、hover），仅重置布局 */
  border: 1px solid #dcdfe6 !important;
}
/* 单独给primary按钮重置边框，匹配主题色 */
.action-btn.el-button--primary {
  border-color: #409eff !important;
}

/* 终极关键：直接控制按钮内部文字容器的绝对居中 */
.action-btn :deep(.el-button__content) {
  /* 清空组件内置的所有 margin/padding */
  margin: 0 !important;
  padding: 0 !important;
  /* 强制flex居中，优先级最高 */
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  /* 占满按钮高度，确保垂直居中 */
  height: 100% !important;
  /* 占满按钮宽度，确保水平居中 */
  width: 100% !important;
  /* 清空任何gap/间距，纯文字无额外间距 */
  gap: 0 !important;
}

/* 清空文字可能的默认间距（兜底） */
.action-btn :deep(.el-button__content) span {
  margin: 0 !important;
  padding: 0 !important;
  line-height: 1 !important; /* 消除行高导致的偏移 */
}

.status-area {
  padding-top: 24px;
  border-top: 1px solid #e2e8f0;
  width: 100%;
  display: flex;
  justify-content: center;
}
</style>
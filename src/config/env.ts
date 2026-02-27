// NGA API 基础配置
export const ngaConfig = {
  baseUrl: 'https://bbs.nga.cn',
  // 遵守 robots.txt 的允许路径
  apiPaths: {
    forum: '/forum.php',
    thread: '/thread.php',
    post: '/read.php',
    misc: '/misc.php',
    // nuke.php 用于获取收藏板块等数据
    nuke: '/nuke.php',
  },
}

// NGA 板块接口类型
export interface NgaForum {
  fid: number
  name: string
  description?: string
  // 板块分组（可选）
  group?: string
  // 子板块（可选）
  children?: NgaForum[]
}

// NGA 主题列表接口类型
export interface NgaThread {
  tid: number
  subject: string
  author: string
  replies: number
  last_post: number
}

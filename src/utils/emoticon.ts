/**
 * NGA 论坛表情代码转换工具
 * 将 [s:ac:表情名] 格式的代码转换为 img 标签（使用图片代理）
 */

import { ngaApiRequest, ProxyImageResponse } from '@/api/nga'

// NGA 表情代码到图片文件名的映射
const NGA_EMOTICON_MAP: Record<string, { file: string }> = {
  // ac 类别表情（按数字排序）
  'blink': { file: 'ac0' },
  'goodjob': { file: 'ac1' },
  '笑': { file: 'ac1' },
  '上': { file: 'ac2' },
  '中枪': { file: 'ac3' },
  '狂': { file: 'ac4' },
  '冷': { file: 'ac5' },
  '凌乱': { file: 'ac6' },
  // '惊': { file: 'ac7' },
  '吓': { file: 'ac8' },
  '吻': { file: 'ac9' },
  '呆': { file: 'ac10' },
  '咦': { file: 'ac11' },
  '汗': { file: 'ac12' },
  '酷': { file: 'ac13' },
  '哭1': { file: 'ac14' },
  '哭笑': { file: 'ac15' },
  '吐': { file: 'ac16' },
  '喘': { file: 'ac17' },
  '喷': { file: 'ac18' },
  '嘲笑': { file: 'ac19' },
  '嘲笑1': { file: 'ac20' },
  '囧': { file: 'ac21' },
  '衰': { file: 'ac22' },
  '心': { file: 'ac23' },
  '忧伤': { file: 'ac24' },
  '怒': { file: 'ac25' },
  '怕': { file: 'ac26' },
  '嘘': { file: 'ac27' },
  '愁': { file: 'ac28' },
  '抓狂': { file: 'ac29' },
  '抠鼻': { file: 'ac30' },
  '擦汗': { file: 'ac31' },
  '无语': { file: 'ac32' },
  '晕': { file: 'ac33' },
  'OK': { file: 'ac34' },
  '瞎': { file: 'ac35' },
  '羞': { file: 'ac36' },
  '羡慕': { file: 'ac37' },
  '花痴': { file: 'ac38' },
  '茶': { file: 'ac39' },
  '风扇': { file: 'ac40' },
  '雨': { file: 'ac41' },
  '赞同': { file: 'ac42' },
  '闪光': { file: 'ac43' },
  '黑枪': { file: 'ac44' },
  '礼物': { file: 'ac45' },
  '蛋糕': { file: 'ac46' },
  '熊猫': { file: 'ac47' },

  // a2 类别表情（按数字排序）
  '偷笑': { file: 'a2_03' },
  '诶嘿': { file: 'a2_05' },
  '那个…': { file: 'a2_08' },
  '哦嗬嗬嗬': { file: 'a2_09' },
  '舔': { file: 'a2_10' },
  '有何贵干': { file: 'a2_11' },
  '病娇': { file: 'a2_12' },
  'lucky': { file: 'a2_13' },
  '鬼脸': { file: 'a2_14' },
  '大哭': { file: 'a2_15' },
  '哭': { file: 'a2_17' },
  '惊': { file: 'a2_19' },
  '你看看你': { file: 'a2_25' },
  'yes': { file: 'a2_26' },
  'doge': { file: 'a2_27' },
  '自戳双目': { file: 'a2_28' },
  '冷笑': { file: 'a2_31' },
  '不活了': { file: 'a2_33' },
  '不明觉厉': { file: 'a2_36' },
  'jojo立3': { file: 'a2_39' },
  'jojo立5': { file: 'a2_40' },
  '威吓': { file: 'a2_42' },
  '你已经死了': { file: 'a2_45' },
  '认真': { file: 'a2_48' },
  '干杯': { file: 'a2_54' },
  '干杯2': { file: 'a2_55' },

  // ng 类别表情
  '扇笑': { file: 'ng_8' },
  '吃瓜': { file: 'ng_17' },

  // pst 类别表情
  '亲': { file: 'pt01' },
  '偷笑3': { file: 'pt04' },
  '呆3': { file: 'pt11' },
}

// NGA 表情 CDN 基础 URL
const NGA_EMOTICON_BASE_URL = 'https://img4.nga.178.com/ngabbs/post/smile'

// 图片代理缓存
const imageCache = new Map<string, string>()

/**
 * 通过代理获取图片并返回 data URL
 */
async function fetchImageViaProxy(imageUrl: string): Promise<string> {
  // 检查缓存
  if (imageCache.has(imageUrl)) {
    return imageCache.get(imageUrl)!
  }

  try {
    const response: ProxyImageResponse = await ngaApiRequest.proxyImage(imageUrl)
    if (response.success && response.data_url) {
      imageCache.set(imageUrl, response.data_url)
      return response.data_url
    }
  } catch (error) {
    console.error('代理图片失败:', imageUrl, error)
  }

  // 失败时返回原图 URL
  return imageUrl
}

/**
 * 将 NGA 表情代码转换为 img 标签（异步版本）
 * @param content 包含表情代码的 HTML 内容
 * @returns 转换后的 HTML 内容
 */
export async function convertNgEmoticonsAsync(content: string): Promise<string> {
  if (!content) return content

  // 匹配 [s:类别:表情名] 格式的代码
  const emoticonPattern = /\[s:([a-z0-9]+):([^\]]+)\]/g
  const matches = Array.from(content.matchAll(emoticonPattern))

  if (matches.length === 0) {
    return content
  }

  // 收集所有需要代理的图片 URL
  const imagePromises: Promise<void>[] = []
  const urlMap = new Map<string, string>() // 原始 URL -> data URL

  for (const match of matches) {
    const [, , emoticonName] = match
    const mapped = NGA_EMOTICON_MAP[emoticonName]

    if (mapped) {
      const originalUrl = `${NGA_EMOTICON_BASE_URL}/${mapped.file}.png`

      // 异步获取图片
      const promise = fetchImageViaProxy(originalUrl).then(dataUrl => {
        urlMap.set(originalUrl, dataUrl)
      })
      imagePromises.push(promise)
    }
  }

  // 等待所有图片加载完成
  await Promise.all(imagePromises)

  // 替换内容中的表情代码
  return content.replace(emoticonPattern, (match, category, emoticonName) => {
    const mapped = NGA_EMOTICON_MAP[emoticonName]

    if (mapped) {
      const originalUrl = `${NGA_EMOTICON_BASE_URL}/${mapped.file}.png`
      const finalUrl = urlMap.get(originalUrl) || originalUrl

      return `<img class="nga-emoticon" src="${finalUrl}" alt="${emoticonName}" style="display: inline-block; vertical-align: middle; max-height: 2.5em; margin: 0 2px;" />`
    }

    // 如果是纯数字格式，直接用类别+数字生成图片 URL
    const num = parseInt(emoticonName)
    if (!isNaN(num)) {
      const originalUrl = `${NGA_EMOTICON_BASE_URL}/${category}${num}.png`
      const finalUrl = urlMap.get(originalUrl) || originalUrl

      return `<img class="nga-emoticon smile_${category}" src="${finalUrl}" alt="${emoticonName}" style="display: inline-block; vertical-align: middle; max-height: 2.5em; margin: 0 2px;" />`
    }

    return match
  })
}

/**
 * 将 NGA 表情代码转换为 img 标签（同步版本，不使用代理）
 * @param content 包含表情代码的 HTML 内容
 * @returns 转换后的 HTML 内容
 */
export function convertNgEmoticons(content: string): string {
  if (!content) return content

  // 匹配 [s:类别:表情名] 格式的代码
  const emoticonPattern = /\[s:([a-z0-9]+):([^\]]+)\]/g

  return content.replace(emoticonPattern, (match, category, emoticonName) => {
    // 先查映射表
    const mapped = NGA_EMOTICON_MAP[emoticonName]

    if (mapped) {
      const imageUrl = `${NGA_EMOTICON_BASE_URL}/${mapped.file}.png`
      return `<img class="nga-emoticon" src="${imageUrl}" alt="${emoticonName}" style="display: inline-block; vertical-align: middle; max-height: 2.5em; margin: 0 2px;" />`
    }

    // 如果是纯数字格式，直接用类别+数字生成图片 URL
    const num = parseInt(emoticonName)
    if (!isNaN(num)) {
      const imageUrl = `${NGA_EMOTICON_BASE_URL}/${category}${num}.png`
      return `<img class="nga-emoticon" src="${imageUrl}" alt="${emoticonName}" style="display: inline-block; vertical-align: middle; max-height: 2.5em; margin: 0 2px;" />`
    }

    // 如果映射表里没有，返回原始代码
    return match
  })
}

/**
 * 扩展表情映射表
 */
export function addEmoticonMapping(name: string, file: string) {
  NGA_EMOTICON_MAP[name] = { file }
}

/**
 * 解析 NGA 引用块
 * 将 [quote]...[/quote] 转换为带样式的 HTML
 */
export function parseNgaQuotes(content: string): string {
  if (!content) return content

  // 匹配 [quote]...[/quote] 块
  const quotePattern = /\[quote\]([\s\S]*?)\[\/quote\]/gi

  return content.replace(quotePattern, (_match: string, innerContent: string) => {
    // 解析引用头信息
    // 格式: [tid=46277635]Topic[/tid] [b]Post by [uid=66691747]法伦施泰尔[/uid] (2026-02-28 11:17):[/b]
    let header = ''
    let bodyContent = innerContent

    // 提取 tid（主题ID）
    const tidMatch = innerContent.match(/\[tid=(\d+)\](.+?)\[\/tid\]/i)
    if (tidMatch) {
      // tid 暂不处理，可以做链接
      bodyContent = bodyContent.replace(tidMatch[0], '')
    }

    // 提取 uid（用户ID）和时间
    const postByMatch = innerContent.match(/\[b\]Post by\s+\[uid=(\d+)\](.+?)\[\/uid\]\s*\((\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})\):\[\/b\]/i)
    if (postByMatch) {
      const username = postByMatch[2]
      const time = postByMatch[3]
      header = `<div class="nga-quote-header" style="font-size: 0.85em; color: #666; margin-bottom: 8px; border-bottom: 1px solid #e0e0e0; padding-bottom: 4px;">
        <span style="font-weight: 500;">引用</span> <span class="nga-quote-user" style="color: #1976d2;">${username}</span>
        <span class="nga-quote-time" style="color: #999; font-size: 0.9em;">(${time})</span>
      </div>`
      bodyContent = bodyContent.replace(postByMatch[0], '')
    } else {
      // 简单的引用格式，只显示"引用"
      header = `<div class="nga-quote-header" style="font-size: 0.85em; color: #666; margin-bottom: 8px; border-bottom: 1px solid #e0e0e0; padding-bottom: 4px;">
        <span style="font-weight: 500;">引用</span>
      </div>`
    }

    // 处理 [b]...[/b] 粗体标签
    bodyContent = bodyContent.replace(/\[b\]([\s\S]*?)\[\/b\]/gi, '<strong>$1</strong>')

    // 处理剩余的 [uid]...[/uid] 标签
    bodyContent = bodyContent.replace(/\[uid=(\d+)\](.+?)\[\/uid\]/gi, '<span class="nga-user-link" style="color: #1976d2;">$2</span>')

    // 处理剩余的 [tid]...[/tid] 标签
    bodyContent = bodyContent.replace(/\[tid=(\d+)\](.+?)\[\/tid\]/gi, '<span class="nga-topic-link" style="color: #1976d2;">$2</span>')

    // 处理 [pid=...]Reply[/pid] 标签（楼层跳转）
    bodyContent = bodyContent.replace(/\[pid=([\d,]+)\]Reply\[\/pid\]/gi, (_match: string, pidStr: string) => {
      // 提取第一个 pid（目标回复的 pid）
      const pids = pidStr.split(',')
      const targetPid = pids[0]
      return `<span class="nga-reply-link" data-pid="${targetPid}" style="color: #1976d2; font-size: 0.9em; cursor: pointer; text-decoration: underline; text-decoration-style: dotted;">↗ 查看引用</span>`
    })

    // 清理多余的换行
    bodyContent = bodyContent.trim()

    return `<div class="nga-quote-block" style="background: #f5f5f5; border-left: 3px solid #ddd; padding: 8px 10px; margin: 4px 0; border-radius: 0 4px 4px 0;">
      ${header}
      <div class="nga-quote-content" style="font-size: 0.95em; line-height: 1.6; color: #333;">${bodyContent}</div>
    </div>`
  })
}

/**
 * 解析内联引用格式
 * 将 [b]Reply to [pid=...]Reply[/pid] Post by [uid=...]用户名[/uid] (时间)[/b] 转换为带样式的 HTML
 */
export function parseInlineQuotes(content: string): string {
  if (!content) return content

  let parsed = content

  // 匹配格式1：普通用户
  // [b]Reply to [pid=...]Reply[/pid] Post by [uid=123]用户名[/uid] (时间)[/b]
  const normalUserPattern = /\[b\]Reply to\s+\[pid=([\d,]+)\]Reply\[\/pid\]\s+Post by\s+\[uid=(\d+)\](.+?)\[\/uid\]\s*\((\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})\)\[\/b\]/gi

  parsed = parsed.replace(normalUserPattern, (_match: string, pidStr: string, _uid: string, username: string, time: string) => {
    const pid = pidStr.split(',')[0]
    return `<div class="nga-inline-quote" style="background: #f0f7ff; border-left: 3px solid #2196f3; padding: 6px 10px; margin: 4px 0; border-radius: 0 4px 4px 0;">
      <span class="nga-inline-quote-link" data-pid="${pid}" style="color: #1976d2; font-size: 0.85em; cursor: pointer; text-decoration: underline; text-decoration-style: dotted;">↗ 回复</span>
      <span style="font-size: 0.85em; color: #666;">回复 </span>
      <span class="nga-quote-user" style="color: #1976d2; font-size: 0.9em;">${username}</span>
      <span class="nga-quote-time" style="color: #999; font-size: 0.85em;"> (${time})</span>
    </div>`
  })

  // 匹配格式2：匿名用户
  // [b]Reply to [pid=...]Reply[/pid] Post by [uid]#anony_xxx[/uid][color=gray](X楼)[/color] (时间)[/b]
  // 注意：楼层号可能被 [color=xxx] 标签包裹
  const anonUserPattern = /\[b\]Reply to\s+\[pid=([\d,]+)\]Reply\[\/pid\]\s+Post by\s+\[uid\]#anony_[a-f0-9]+\[\/uid\](?:\[color=[^\]]+\])?\((\d+)楼\)(?:\[\/color\])?\s*\((\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})\)\[\/b\]/gi

  parsed = parsed.replace(anonUserPattern, (_match: string, pidStr: string, floor: string, time: string) => {
    const pid = pidStr.split(',')[0]
    return `<div class="nga-inline-quote" style="background: #f0f7ff; border-left: 3px solid #2196f3; padding: 6px 10px; margin: 4px 0; border-radius: 0 4px 4px 0;">
      <span class="nga-inline-quote-link" data-pid="${pid}" style="color: #1976d2; font-size: 0.85em; cursor: pointer; text-decoration: underline; text-decoration-style: dotted;">↗ 回复</span>
      <span style="font-size: 0.85em; color: #666;">回复 </span>
      <span class="nga-quote-user" style="color: #1976d2; font-size: 0.9em;">匿名用户</span>
      <span class="nga-quote-floor" style="color: #999; font-size: 0.85em;"> (${floor}楼)</span>
      <span class="nga-quote-time" style="color: #999; font-size: 0.85em;"> (${time})</span>
    </div>`
  })

  // 如果上面的匹配失败，尝试不带 [b] 标签的版本
  const anonUserPatternNoB = /Reply to\s+\[pid=([\d,]+)\]Reply\[\/pid\]\s+Post by\s+\[uid\]#anony_[a-f0-9]+\[\/uid\](?:\[color=[^\]]+\])?\((\d+)楼\)(?:\[\/color\])?\s*\((\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})\)/gi

  parsed = parsed.replace(anonUserPatternNoB, (_match: string, pidStr: string, floor: string, time: string) => {
    const pid = pidStr.split(',')[0]
    return `<div class="nga-inline-quote" style="background: #f0f7ff; border-left: 3px solid #2196f3; padding: 6px 10px; margin: 4px 0; border-radius: 0 4px 4px 0;">
      <span class="nga-inline-quote-link" data-pid="${pid}" style="color: #1976d2; font-size: 0.85em; cursor: pointer; text-decoration: underline; text-decoration-style: dotted;">↗ 回复</span>
      <span style="font-size: 0.85em; color: #666;">回复 </span>
      <span class="nga-quote-user" style="color: #1976d2; font-size: 0.9em;">匿名用户</span>
      <span class="nga-quote-floor" style="color: #999; font-size: 0.85em;"> (${floor}楼)</span>
      <span class="nga-quote-time" style="color: #999; font-size: 0.85em;"> (${time})</span>
    </div>`
  })

  // 匹配格式3：主题引用（没有 [b] 标签）
  // Reply to [tid=46301512]Topic[/tid] Post by [uid=67113223]用户名[/uid] (2026-03-03 20:28)
  const topicQuotePattern = /Reply to\s+\[tid=(\d+)\]Topic\[\/tid\]\s+Post by\s+\[uid=(\d+)\](.+?)\[\/uid\]\s*\((\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})\)/gi

  parsed = parsed.replace(topicQuotePattern, (_match: string, _tid: string, _uid: string, username: string, time: string) => {
    return `<div class="nga-inline-quote" style="background: #fff7ed; border-left: 3px solid #f97316; padding: 6px 10px; margin: 4px 0; border-radius: 0 4px 4px 0;">
      <span style="font-size: 0.85em; color: #666;">引用主题 </span>
      <span class="nga-quote-user" style="color: #ea580c; font-size: 0.9em;">${username}</span>
      <span class="nga-quote-time" style="color: #999; font-size: 0.85em;"> (${time})</span>
    </div>`
  })

  // 匹配格式4：回复引用（没有 [b] 标签）
  // Reply to [pid=858176841,46205850,1]Reply[/pid] Post by [uid=65197075]用户名[/uid] (2026-02-14 16:23)
  const replyQuotePattern = /Reply to\s+\[pid=([\d,]+)\]Reply\[\/pid\]\s+Post by\s+\[uid=(\d+)\](.+?)\[\/uid\]\s*\((\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})\)/gi

  parsed = parsed.replace(replyQuotePattern, (_match: string, pidStr: string, _uid: string, username: string, time: string) => {
    const pid = pidStr.split(',')[0]
    return `<div class="nga-inline-quote" style="background: #f0f7ff; border-left: 3px solid #2196f3; padding: 6px 10px; margin: 4px 0; border-radius: 0 4px 4px 0;">
      <span class="nga-inline-quote-link" data-pid="${pid}" style="color: #1976d2; font-size: 0.85em; cursor: pointer; text-decoration: underline; text-decoration-style: dotted;">↗ 回复</span>
      <span style="font-size: 0.85em; color: #666;">回复 </span>
      <span class="nga-quote-user" style="color: #1976d2; font-size: 0.9em;">${username}</span>
      <span class="nga-quote-time" style="color: #999; font-size: 0.85em;"> (${time})</span>
    </div>`
  })

  // 匹配格式5：匿名用户回复引用（没有 [b] 标签）
  // Reply to [pid=849766411,45707239,1]Reply[/pid] Post by [uid]#anony_725eba0a098fb56a56ae2e6a35ae3ac8[/uid](4楼) (2025-12-02 18:46)
  const anonReplyQuotePattern = /Reply to\s+\[pid=([\d,]+)\]Reply\[\/pid\]\s+Post by\s+\[uid\]#anony_[a-f0-9]+\[\/uid\]\((\d+)楼\)\s*\((\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})\)/gi

  parsed = parsed.replace(anonReplyQuotePattern, (_match: string, pidStr: string, floor: string, time: string) => {
    const pid = pidStr.split(',')[0]
    return `<div class="nga-inline-quote" style="background: #f0f7ff; border-left: 3px solid #2196f3; padding: 6px 10px; margin: 4px 0; border-radius: 0 4px 4px 0;">
      <span class="nga-inline-quote-link" data-pid="${pid}" style="color: #1976d2; font-size: 0.85em; cursor: pointer; text-decoration: underline; text-decoration-style: dotted;">↗ 回复</span>
      <span style="font-size: 0.85em; color: #666;">回复 </span>
      <span class="nga-quote-user" style="color: #1976d2; font-size: 0.9em;">匿名用户</span>
      <span class="nga-quote-floor" style="color: #999; font-size: 0.85em;"> (${floor}楼)</span>
      <span class="nga-quote-time" style="color: #999; font-size: 0.85em;"> (${time})</span>
    </div>`
  })

  return parsed
}

/**
 * 解析 NGA 图片标签（异步版本，使用代理）
 * 将 [img]./path/to/image.jpg[/img] 转换为 img 标签
 */
async function parseNgaImagesAsync(content: string): Promise<string> {
  if (!content) return content

  // 匹配 [img]...[/img] 格式，支持相对路径和完整 URL
  // 格式1: [img]./path[/img]
  // 格式2: [img]http://...[/img]
  const imgPattern = /\[img\](.+?)\[\/img\]/gi
  const matches = Array.from(content.matchAll(imgPattern))

  if (matches.length === 0) {
    return content
  }

  // 收集所有需要代理的图片 URL
  const imagePromises: Promise<void>[] = []
  const urlMap = new Map<string, string>() // 原始 URL -> data URL

  for (const match of matches) {
    let imageUrl = match[1]

    // 如果是相对路径，转换为完整 URL
    if (imageUrl.startsWith('./')) {
      imageUrl = `https://img.nga.178.com/attachments/${imageUrl.substring(2)}`
    }
    // 如果是以 http:// 或 https:// 开头，直接使用
    // 保持不变

    // 异步获取图片
    const promise = fetchImageViaProxy(imageUrl).then(dataUrl => {
      urlMap.set(imageUrl, dataUrl)
    })
    imagePromises.push(promise)
  }

  // 等待所有图片加载完成
  await Promise.all(imagePromises)

  // 替换内容中的图片标签
  return content.replace(imgPattern, (_match: string, imagePath: string) => {
    let fullUrl = imagePath

    // 如果是相对路径，转换为完整 URL
    if (imagePath.startsWith('./')) {
      fullUrl = `https://img.nga.178.com/attachments/${imagePath.substring(2)}`
    }

    const finalUrl = urlMap.get(fullUrl) || fullUrl

    // 返回 img 标签
    return `<img class="nga-post-image" src="${finalUrl}" alt="图片" style="max-width: 100%; height: auto; display: block; margin: 8px 0; border-radius: 4px;" loading="lazy" />`
  })
}

/**
 * 解析 NGA BBCode 格式
 * 处理 size, list, b, color 等标签
 */
export function parseBBCode(content: string): string {
  if (!content) return content

  let parsed = content

  // 处理 [size=数值]...[/size] 字体大小
  parsed = parsed.replace(/\[size=(\d+)%\]([\s\S]*?)\[\/size\]/gi, (_match: string, size: string, inner: string) => {
    const fontSize = Math.min(Math.max(parseInt(size), 80), 200) / 100
    return `<span style="font-size: ${fontSize}em;">${inner}</span>`
  })

  // 处理 [list] [*]... [/list] 列表
  parsed = parsed.replace(/\[list\]([\s\S]*?)\[\/list\]/gi, (_match: string, inner: string) => {
    const items = inner.split(/\[\*\]/g).filter((s: string) => s.trim().length > 0)
    const listItems = items.map((item: string) => `<li style="margin: 4px 0;">${item}</li>`).join('')
    return `<ul style="margin: 8px 0; padding-left: 20px; list-style-type: disc;">${listItems}</ul>`
  })

  // 处理 [b]...[/b] 粗体（如果还没被处理）
  parsed = parsed.replace(/\[b\]([\s\S]*?)\[\/b\]/gi, '<strong>$1</strong>')

  // 处理 [color=颜色]...[/color] 颜色
  parsed = parsed.replace(/\[color=([^\]]+)\]([\s\S]*?)\[\/color\]/gi, (_match: string, color: string, inner: string) => {
    return `<span style="color: ${color};">${inner}</span>`
  })

  // 处理 [u]...[/u] 下划线
  parsed = parsed.replace(/\[u\]([\s\S]*?)\[\/u\]/gi, '<u>$1</u>')

  // 处理 [i]...[/i] 斜体
  parsed = parsed.replace(/\[i\]([\s\S]*?)\[\/i\]/gi, '<em>$1</em>')

  // 处理 [s]...[/s] 删除线
  parsed = parsed.replace(/\[s\]([\s\S]*?)\[\/s\]/gi, '<s>$1</s>')

  // 处理 [del]...[/del] 删除线
  parsed = parsed.replace(/\[del\]([\s\S]*?)\[\/del\]/gi, '<s>$1</s>')

  return parsed
}

/**
 * 解码 HTML 实体编码
 * 将 &#128591; 这样的编码转换为实际的字符
 */
function decodeHtmlEntities(content: string): string {
  if (!content) return content

  // 使用浏览器的 innerHTML 来解码 HTML 实体
  const textarea = document.createElement('textarea')
  textarea.innerHTML = content
  return textarea.value
}

/**
 * 综合处理 NGA 内容（表情 + 引用块 + 图片 + BBCode）
 */
export async function parseNgaContent(content: string): Promise<string> {
  if (!content) return content

  // 首先解码 HTML 实体编码
  let parsed = decodeHtmlEntities(content)

  // 先解析内联引用（包含 [b] 标签）
  parsed = parseInlineQuotes(parsed)

  // 解析引用块
  parsed = parseNgaQuotes(parsed)

  // 再解析 BBCode
  parsed = parseBBCode(parsed)

  // 解析图片
  parsed = await parseNgaImagesAsync(parsed)

  // 再转换表情
  parsed = await convertNgEmoticonsAsync(parsed)

  return parsed
}

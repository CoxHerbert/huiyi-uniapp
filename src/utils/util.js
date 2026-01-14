import CryptoJS from 'crypto-js'
import { translate } from '@/locales'

// 小工具：统一 CryptoJS 编码与输出
const sha256Hex = input => CryptoJS.SHA256(String(input)).toString()
const toBase64 = input => CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(String(input)))

// 表单序列化
export function serialize(data) {
  let list = []
  Object.keys(data || {}).forEach((ele) => {
    list.push(`${ele}=${data[ele]}`)
  })
  return list.join('&')
}

// 金额格式化  10000->10,000
export function toLocaleString(value) {
  return value?.toLocaleString?.('en-US') || '0'
}

export function getObjType(obj) {
  let toString = Object.prototype.toString
  let map = {
    '[object Boolean]': 'boolean',
    '[object Number]': 'number',
    '[object String]': 'string',
    '[object Function]': 'function',
    '[object Array]': 'array',
    '[object Date]': 'date',
    '[object RegExp]': 'regExp',
    '[object Undefined]': 'undefined',
    '[object Null]': 'null',
    '[object Object]': 'object',
  }
  // uni-app 不一定有 Element
  try {
    if (typeof Element !== 'undefined' && obj instanceof Element)
      return 'element'
  }
  catch (e) {}
  return map[toString.call(obj)]
}

// 对象去除空值
export function removeEmptyValues(obj) {
  return Object.keys(obj || {}).reduce((acc, key) => {
    if (obj[key] !== null && obj[key] !== undefined && obj[key] !== '') {
      acc[key] = obj[key]
    }
    return acc
  }, {})
}

/**
 * 对象深拷贝
 */
export function deepClone(data) {
  let type = getObjType(data)
  let obj
  if (type === 'array')
    obj = []
  else if (type === 'object')
    obj = {}
  else return data

  if (type === 'array') {
    for (let i = 0, len = data.length; i < len; i++) {
      obj.push(deepClone(data[i]))
    }
  }
  else {
    for (let key in data) {
      obj[key] = deepClone(data[key])
    }
  }
  return obj
}

/**
 * 设置灰度模式（仅 H5 生效）
 */
export function toggleGrayMode(status) {
  // #ifdef H5
  if (status) {
    document.body.className = `${document.body.className || ''} grayMode`
  }
  else {
    document.body.className = (document.body.className || '').replace(' grayMode', '')
  }
  // #endif
}

/**
 * 设置主题（仅 H5 生效）
 */
export function setTheme(name) {
  // #ifdef H5
  document.body.className = name
  // #endif
}

/**
 * 加密处理
 * @param {{ data?: Record<string, any>, type: 'Base64'|'SHA256'|'AES'|'Aes', param: string[], key?: string }} params
 */
export function encryption(params) {
  const { data = {}, type, param = [], key } = params || {}
  const result = JSON.parse(JSON.stringify(data))
  if (!Array.isArray(param) || param.length === 0)
    return result

  if (type === 'Base64') {
    param.forEach((ele) => {
      result[ele] = toBase64(result[ele])
    })
  }
  else if (type === 'SHA256') {
    param.forEach((ele) => {
      result[ele] = sha256Hex(result[ele])
    })
  }
  else if (type === 'AES' || type === 'Aes') {
    if (!key)
      console.warn('[encryption] AES 需要提供 key')
    param.forEach((ele) => {
      result[ele] = CryptoJS.AES.encrypt(
        CryptoJS.enc.Utf8.parse(String(result[ele])),
        CryptoJS.enc.Utf8.parse(String(key || '')),
      ).toString()
    })
  }
  return result
}

/**
 * 浏览器判断是否全屏（仅 H5 生效）
 */
export function fullscreenEnable() {
  // #ifdef H5
  let isFullscreen
    = document.fullscreenElement
      || document.webkitFullscreenElement
      || document.mozFullScreenElement
      || document.msFullscreenElement
  return !!isFullscreen
  // #endif
  // #ifndef H5
  return false
  // #endif
}

/**
 * 浏览器全屏（仅 H5 生效）
 */
export function reqFullScreen() {
  // #ifdef H5
  const el = document.documentElement
  if (el.requestFullscreen)
    el.requestFullscreen()
  else if (el.webkitRequestFullScreen)
    el.webkitRequestFullScreen()
  else if (el.mozRequestFullScreen)
    el.mozRequestFullScreen()
  else if (el.msRequestFullscreen)
    el.msRequestFullscreen()
  // #endif
}

/**
 * 浏览器退出全屏（仅 H5 生效）
 */
export function exitFullScreen() {
  // #ifdef H5
  if (document.exitFullscreen)
    document.exitFullscreen()
  else if (document.webkitCancelFullScreen)
    document.webkitCancelFullScreen()
  else if (document.mozCancelFullScreen)
    document.mozCancelFullScreen()
  else if (document.msExitFullscreen)
    document.msExitFullscreen()
  // #endif
}

/**
 * 浏览器全屏切换（仅 H5 生效）
 */
export function fullscreenToggel() {
  // #ifdef H5
  if (fullscreenEnable())
    exitFullScreen()
  else reqFullScreen()
  // #endif
}

/**
 * esc监听全屏（仅 H5 生效）
 */
export function listenfullscreen(callback) {
  // #ifdef H5
  function listen() {
    callback && callback()
  }
  document.addEventListener('fullscreenchange', listen)
  document.addEventListener('mozfullscreenchange', listen)
  document.addEventListener('webkitfullscreenchange', listen)
  document.addEventListener('msfullscreenchange', listen)
  // #endif
}

/**
 * 递归寻找子类的父类
 */
export function findParent(menu, id) {
  for (let i = 0; i < (menu || []).length; i++) {
    if (menu[i].children?.length) {
      for (let j = 0; j < menu[i].children.length; j++) {
        if (menu[i].children[j].id == id) {
          return menu[i]
        }
        else if (menu[i].children[j].children?.length) {
          return findParent(menu[i].children[j].children, id)
        }
      }
    }
  }
}

/**
 * 动态插入css（仅 H5 生效）
 */
export function loadStyle(url) {
  // #ifdef H5
  const link = document.createElement('link')
  link.type = 'text/css'
  link.rel = 'stylesheet'
  link.href = url
  const head = document.getElementsByTagName('head')[0]
  head.appendChild(link)
  // #endif
}

/**
 * 判断路由是否相等
 */
export function diff(obj1, obj2) {
  // 避免直接删原对象（更安全）
  const a = obj1 && typeof obj1 === 'object' ? { ...obj1 } : obj1
  const b = obj2 && typeof obj2 === 'object' ? { ...obj2 } : obj2
  if (a && typeof a === 'object')
    delete a.close

  let o1 = a instanceof Object
  let o2 = b instanceof Object
  if (!o1 || !o2)
    return a === b

  if (Object.keys(a).length !== Object.keys(b).length)
    return false

  for (let attr in a) {
    let t1 = a[attr] instanceof Object
    let t2 = b[attr] instanceof Object
    if (t1 && t2) {
      if (!diff(a[attr], b[attr]))
        return false
    }
    else if (a[attr] !== b[attr]) {
      return false
    }
  }
  return true
}

/**
 * 根据字典的value查找对应的index
 */
export function findArray(dic, value) {
  for (let i = 0; i < (dic || []).length; i++) {
    if (dic[i].value == value)
      return i
  }
  return -1
}

/**
 * 生成随机len位数字
 */
export function randomLenNum(len, date) {
  let random = Math.ceil(Math.random() * 100000000000000)
    .toString()
    .substr(0, len || 4)
  if (date)
    random = random + Date.now()
  return random
}

/**
 * 打开小窗口（仅 H5 生效）
 */
export function openWindow(url, title, w, h) {
  // #ifdef H5
  const dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : screen.left
  const dualScreenTop = window.screenTop !== undefined ? window.screenTop : screen.top

  const width = window.innerWidth
    ? window.innerWidth
    : document.documentElement.clientWidth
      ? document.documentElement.clientWidth
      : screen.width
  const height = window.innerHeight
    ? window.innerHeight
    : document.documentElement.clientHeight
      ? document.documentElement.clientHeight
      : screen.height

  const left = width / 2 - w / 2 + dualScreenLeft
  const top = height / 2 - h / 2 + dualScreenTop
  const newWindow = window.open(
    url,
    title,
    `toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=yes, copyhistory=no, width=${
      w
    }, height=${
      h
    }, top=${
      top
    }, left=${
      left}`,
  )

  if (window.focus && newWindow)
    newWindow.focus()
  // #endif
  // #ifndef H5
  // App/小程序不支持 window.open，给出降级：复制链接
  uni.setClipboardData({
    data: String(url || ''),
    success: () => uni.showToast({ title: '链接已复制', icon: 'none' }),
  })
  // #endif
}

export function getScreen(isCollapse) {
  // uni-app 获取屏幕宽度
  const { windowWidth } = uni.getSystemInfoSync()
  if (windowWidth <= 768)
    return !isCollapse
  return isCollapse
}

/**
 * 获取顶部地址栏地址（H5）/ App&小程序返回空串或拼接站点（按需）
 */
export function getTopUrl() {
  // #ifdef H5
  return window.location.href.split('/#/')[0]
  // #endif
  // #ifndef H5
  return ''
  // #endif
}

/**
 * 获取 url 参数（优先用 uni-app 的路由参数）
 * - 在 uni-app 页面里：this.$route / onLoad(options) 里拿更准
 * - 这里提供一个 H5 兜底
 */
export function getQueryString(name) {
  // #ifdef H5
  let reg = new RegExp(`(^|&)${name}=([^&]*)(&|$)`, 'i')
  let r = window.location.search.substr(1).match(reg)
  if (r != null)
    return unescape(decodeURI(r[2]))
  return null
  // #endif
  // #ifndef H5
  return null
  // #endif
}

/**
 * 下载文件（统一入口）
 * - 非 H5：uni.downloadFile -> uni.saveFile（可返回 savedFilePath）
 * - H5：走 Blob / a 标签（同你原逻辑）
 */
export function downloadFile(path, name) {
  if (!path)
    return Promise.reject(new Error('path is required'))
  const filename = name || `file_${Date.now()}`

  // #ifdef H5
  return new Promise((resolve, reject) => {
    try {
      const xhr = new XMLHttpRequest()
      xhr.open('get', path)
      xhr.responseType = 'blob'
      xhr.send()
      xhr.onload = function () {
        if (this.status === 200 || this.status === 304) {
          const url = URL.createObjectURL(this.response)
          const a = document.createElement('a')
          a.style.display = 'none'
          a.href = url
          a.download = filename
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
          resolve()
        }
        else {
          reject(new Error(`download failed: ${this.status}`))
        }
      }
      xhr.onerror = () => reject(new Error('download error'))
    }
    catch (e) {
      reject(e)
    }
  })
  // #endif

  // #ifndef H5
  return new Promise((resolve, reject) => {
    uni.downloadFile({
      url: path,
      success: (res) => {
        if (res.statusCode === 200) {
          uni.saveFile({
            tempFilePath: res.tempFilePath,
            success: (saveRes) => {
              // 如需直接打开：uni.openDocument / plus.runtime.openFile
              resolve(saveRes.savedFilePath)
            },
            fail: reject,
          })
        }
        else {
          reject(new Error(`download failed: ${res.statusCode}`))
        }
      },
      fail: reject,
    })
  })
  // #endif
}

// 兼容你原来的命名：Blob / Promise 版本统一转调
export const downloadFileBlob = (path, name) => downloadFile(path, name)
export const downloadFileBlobPromise = (path, name) => downloadFile(path, name)

// H5 Base64 下载：只在 H5 有意义（其他端直接走 downloadFile 即可）
export function downloadFileBase64(path, name) {
  // #ifdef H5
  const xhr = new XMLHttpRequest()
  xhr.open('get', path)
  xhr.responseType = 'blob'
  xhr.send()
  xhr.onload = function () {
    if (this.status === 200 || this.status === 304) {
      const fileReader = new FileReader()
      fileReader.readAsDataURL(this.response)
      fileReader.onload = function () {
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = this.result
        a.download = name || `file_${Date.now()}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      }
    }
  }
  // #endif
  // #ifndef H5
  return downloadFile(path, name)
  // #endif
}

/**
 * 下载 excel/pdf：在 uni-app 场景下更推荐直接用 downloadFile(url, filename)
 * 如果你手里就是 ArrayBuffer/Blob（多见于 H5 axios），保留 H5 逻辑
 */
export function downloadXls(fileArrayBuffer, filename) {
  // #ifdef H5
  let data = new Blob([fileArrayBuffer], { type: 'application/vnd.ms-excel,charset=utf-8' })
  const link = document.createElement('a')
  link.href = window.URL.createObjectURL(data)
  link.download = filename || `excel_${Date.now()}.xls`
  link.click()
  // #endif
}

export function downloadPdf(fileArrayBuffer, filename) {
  // #ifdef H5
  let data = new Blob([fileArrayBuffer], { type: 'application/pdf' })
  const link = document.createElement('a')
  link.href = window.URL.createObjectURL(data)
  link.download = filename || `file_${Date.now()}.pdf`
  link.click()
  // #endif
}

// 字符串格式化(%s )
export function sprintf(str) {
  let args = arguments
  let flag = true
  let i = 1
  str = str.replace(/%s/g, () => {
    let arg = args[i++]
    if (typeof arg === 'undefined') {
      flag = false
      return ''
    }
    return arg
  })
  return flag ? str : ''
}

// 转换字符串，undefined,null等转化为""
export function parseStrEmpty(str) {
  if (!str || str == 'undefined' || str == 'null')
    return ''
  return str
}

// 数据合并
export function mergeRecursive(source, target) {
  for (let p in target) {
    try {
      if (target[p].constructor == Object) {
        source[p] = mergeRecursive(source[p], target[p])
      }
      else {
        source[p] = target[p]
      }
    }
    catch (e) {
      source[p] = target[p]
    }
  }
  return source
}

/**
 * 构造树型结构数据
 */
export function handleTree(data, id, parentId, children) {
  let config = {
    id: id || 'id',
    parentId: parentId || 'parentId',
    childrenList: children || 'children',
  }

  let childrenListMap = {}
  let nodeIds = {}
  let tree = []

  for (let d of data || []) {
    let pId = d[config.parentId]
    if (childrenListMap[pId] == null)
      childrenListMap[pId] = []
    nodeIds[d[config.id]] = d
    childrenListMap[pId].push(d)
  }

  for (let d of data || []) {
    let pId = d[config.parentId]
    if (nodeIds[pId] == null)
      tree.push(d)
  }

  for (let t of tree) adaptToChildrenList(t)

  function adaptToChildrenList(o) {
    if (childrenListMap[o[config.id]] != null) {
      o[config.childrenList] = childrenListMap[o[config.id]]
    }
    if (o[config.childrenList]) {
      for (let c of o[config.childrenList]) adaptToChildrenList(c)
    }
  }

  return tree
}

/**
 * 参数处理
 */
export function tansParams(params) {
  let result = ''
  for (const propName of Object.keys(params || {})) {
    const value = params[propName]
    let part = `${encodeURIComponent(propName)}=`
    if (value !== null && value !== '' && typeof value !== 'undefined') {
      if (typeof value === 'object') {
        for (const key of Object.keys(value || {})) {
          if (value[key] !== null && value[key] !== '' && typeof value[key] !== 'undefined') {
            let p = `${propName}[${key}]`
            let subPart = `${encodeURIComponent(p)}=`
            result += `${subPart + encodeURIComponent(value[key])}&`
          }
        }
      }
      else {
        result += `${part + encodeURIComponent(value)}&`
      }
    }
  }
  if (typeof result === 'string')
    result = result.replace(/&$/, '')
  return result
}

// 返回项目路径
export function getNormalPath(p) {
  if (!p || p.length === 0 || p == 'undefined')
    return p
  let res = p.replace('//', '/')
  if (res[res.length - 1] === '/')
    return res.slice(0, res.length - 1)
  return res
}

// 验证是否为blob格式
export function blobValidate(data) {
  return data?.type !== 'application/json'
}

/**
 * 秒、分钟、小时之间的时间单位转换
 */
export function convertTime({ value, from, to, decimal = 3 }) {
  const unitToSeconds = { s: 1, m: 60, h: 3600 }
  if (!unitToSeconds[from] || !unitToSeconds[to]) {
    const fallbackMessage = `不支持的时间单位: ${from} 或 ${to}`
    throw new Error(translate('common.time.unsupportedUnit', fallbackMessage, { from, to }))
  }
  const valueInSeconds = value * unitToSeconds[from]
  const result = valueInSeconds / unitToSeconds[to]
  return Number.parseFloat(result.toFixed(decimal))
}

// 截取文件类型
export function getFileExtension(url) {
  if (!url)
    return ''
  const parts = url.split('?')[0].split('.')
  return parts.length > 1 ? parts.pop().toLowerCase() : ''
}

// 是否外链（仅 H5 精确判断；其他端用简单正则）
export function isExternalUrl(url) {
  if (!url)
    return false

  // #ifdef H5
  const link = document.createElement('a')
  link.href = url
  const currentHost = window.location.hostname
  return link.hostname !== currentHost
  // #endif

  // #ifndef H5
  return /^(https?:)?\/\//i.test(url)
  // #endif
}

// 根据name获取地址栏参数（H5）；非 H5 返回 null
export function getUrlCode(name) {
  // #ifdef H5
  return (
    decodeURIComponent(
      (new RegExp(`[?|&]${name}=` + `([^&;]+?)(&|#|;|$)`).exec(new URL(location.href)) || [
        ,
        '',
      ])[1].replace(/\+/g, '%20'),
    ) || null
  )
  // #endif
  // #ifndef H5
  return null
  // #endif
}

// 适配 base（uni-app 里更常用：process.env.UNI_BASE_URL 或自己封装）
export function withBase(p) {
  const base = (import.meta && import.meta.env && import.meta.env.BASE_URL) ? import.meta.env.BASE_URL : '/'
  return base + String(p || '').replace(/^\/+/, '')
}

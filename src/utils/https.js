import { Base64 } from 'js-base64'
import website from '@/config/website'
import { useAuthStore } from '@/store/auth'
import { getCurrentPath } from '@/utils'
import { getToken, removeRefreshToken, removeToken } from '@/utils/auth'
import crypto from '@/utils/crypto'
import { serialize, tansParams } from '@/utils/util'
import { isURL, validatenull } from '@/utils/validate'

const baseUrl = 'https://www.eastwinbip.com/api'

let isErrorShown = false
let isLoginModalShown = false

function toastError(message, cfg) {
  if (cfg?.noErrorMsg)
    return

  uni.showToast({
    title: message || '系统错误',
    icon: 'none',
    duration: 2000,
  })
}

function showLoginExpiredConfirm() {
  if (isLoginModalShown)
    return

  isLoginModalShown = true
  const rawRedirect = getCurrentPath()
  const redirect = rawRedirect ? `/${rawRedirect}` : ''
  const loginUrl = redirect
    ? `/pages/login/index?redirect=${encodeURIComponent(redirect)}`
    : '/pages/login/index'

  uni.showModal({
    title: '提示',
    content: '用户登录已过期，请重新登录',
    confirmText: '去登录',
    cancelText: '取消',
    success(res) {
      if (res.confirm) {
        uni.reLaunch({ url: loginUrl })
      }
    },
    complete() {
      setTimeout(() => {
        isLoginModalShown = false
      }, 200)
    },
  })
}

function mergeHeaders(base = {}, extra = {}) {
  return Object.assign({}, base || {}, extra || {})
}

function normalizeConfig(config = {}) {
  const cfg = { ...config }
  cfg.method = (cfg.method || 'GET').toUpperCase()
  cfg.headers = mergeHeaders(cfg.headers, cfg.header)
  cfg.meta = cfg.meta || {}
  return cfg
}

function startLoading(cfg) {
  if (cfg?.meta?.noLoading)
    return

  uni.showLoading({ title: '加载中...', mask: true })
}

function stopLoading(cfg) {
  if (cfg?.meta?.noLoading)
    return

  uni.hideLoading()
}

async function uniRequestOnce(rawConfig) {
  const config = normalizeConfig(rawConfig)

  startLoading(config)
  isErrorShown = false

  try {
    if (
      config.url
      && !isURL(config.url)
      && !config.url.startsWith(baseUrl)
    ) {
      config.url = baseUrl + config.url
    }

    config.headers['Blade-Requested-With'] = 'BladeHttpRequest'

    if (config.authorization !== false) {
      config.headers.Authorization = `Basic ${Base64.encode(
        `${website.clientId}:${website.clientSecret}`,
      )}`
    }

    const isToken = config.meta.isToken === false
    const cryptoToken = config.cryptoToken === true
    const token = getToken()
    if (token && !isToken) {
      config.headers[website.tokenHeader] = cryptoToken
        ? `crypto ${crypto.encryptAES(token, crypto.cryptoKey)}`
        : `bearer ${token}`
    }

    const cryptoData = config.cryptoData === true
    if (cryptoData) {
      if (config.params) {
        const data = crypto.encryptAES(JSON.stringify(config.params), crypto.aesKey)
        config.params = { data }
      }
      if (config.data) {
        config.text = true
        config.data = crypto.encryptAES(JSON.stringify(config.data), crypto.aesKey)
      }
    }

    if (config.text === true) {
      config.headers['Content-Type'] = 'text/plain'
    }

    if (config.method === 'POST' && config.meta.isSerialize === true) {
      config.data = serialize(config.data)
      config.headers['Content-Type']
        = config.headers['Content-Type'] || 'application/x-www-form-urlencoded'
    }

    if (config.params) {
      const sep = config.url.includes('?') ? '&' : '?'
      config.url += sep + tansParams(config.params)
      delete config.params
    }

    const reqOptions = {
      url: config.url,
      method: config.method,
      header: config.headers,
      data: config.data,
      timeout: config.timeout || 300000,
      withCredentials: config.withCredentials === true,
    }

    const resp = await new Promise((resolve, reject) => {
      uni.request({
        ...reqOptions,
        success: resolve,
        fail: reject,
      })
    })

    return {
      data: resp.data,
      status: resp.statusCode,
      headers: resp.header,
      config,
    }
  }
  finally {
    stopLoading(config)
  }
}

async function handle401(res) {
  const config = res.config
  const message = res.data?.msg || res.data?.error_description || '用户登录已过期'

  if (config?.meta?.ignoreAuthRedirect) {
    throw res
  }

  if (!config._retried) {
    config._retried = true
    try {
      const auth = useAuthStore()
      await auth.refresh()
      const retryRes = await uniRequestOnce(config)
      return await handleResponse(retryRes)
    }
    catch (error) {
      if (!isErrorShown) {
        isErrorShown = true
        toastError(message, config)
      }

      const auth = useAuthStore()
      auth.logout?.()
      removeToken()
      removeRefreshToken()
      showLoginExpiredConfirm()

      throw error instanceof Error ? error : new Error(message)
    }
  }

  if (!isErrorShown) {
    isErrorShown = true
    showLoginExpiredConfirm()
  }

  const auth = useAuthStore()
  auth.logout?.()
  removeToken()
  removeRefreshToken()

  throw new Error(message)
}

async function handleResponse(res) {
  const status = res.data?.error_code ?? res.data?.code ?? res.status
  const statusWhiteList = website.statusWhiteList || []
  const message = res.data?.msg || res.data?.error_description
  const config = res.config
  const cryptoData = config.cryptoData === true

  if (statusWhiteList.includes(status)) {
    throw res
  }

  if (status === 401) {
    return handle401(res)
  }

  if (status > 2000 && !validatenull(res.data?.error_description)) {
    if (!isErrorShown) {
      isErrorShown = true
      toastError(message, config)
    }
    throw new Error(message)
  }

  if (status !== 200) {
    toastError(message, config)
    throw new Error(message)
  }

  if (cryptoData) {
    res.data = JSON.parse(crypto.decryptAES(res.data, crypto.aesKey))
  }

  return res
}

async function request(config) {
  try {
    const res = await uniRequestOnce(config)
    return await handleResponse(res)
  }
  catch (error) {
    if (error && error.errMsg) {
      toastError('网络异常', config)
      throw new Error(error.errMsg)
    }

    if (error instanceof Error)
      throw error

    throw new Error('网络异常')
  }
}

request.get = (url, cfg = {}) => request({ url, method: 'GET', ...cfg })
request.post = (url, data, cfg = {}) => request({ url, method: 'POST', data, ...cfg })
request.put = (url, data, cfg = {}) => request({ url, method: 'PUT', data, ...cfg })
request.delete = (url, cfg = {}) => request({ url, method: 'DELETE', ...cfg })

export default request
export { request }

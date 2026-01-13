export type H5RequestConfig = {
  url: string
  method?: string
  params?: Record<string, unknown>
  data?: unknown
  headers?: Record<string, string>
}

const getBaseUrl = () => import.meta.env.VITE_API_BASE_URL || ''

const isAbsoluteUrl = (url: string) => /^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(url)

const serializeParams = (params: Record<string, unknown>) =>
  Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return value
          .map((item) => `${encodeURIComponent(key)}=${encodeURIComponent(String(item))}`)
          .join('&')
      }
      return `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`
    })
    .filter(Boolean)
    .join('&')

const appendQuery = (url: string, params: Record<string, unknown>) => {
  const query = serializeParams(params)
  if (!query) return url
  return url.includes('?') ? `${url}&${query}` : `${url}?${query}`
}

const resolveUrl = (url: string) => {
  if (isAbsoluteUrl(url) || !getBaseUrl()) return url
  return `${getBaseUrl()}${url.startsWith('/') ? url : `/${url}`}`
}

const request = (config: H5RequestConfig) => {
  const method = (config.method || 'GET').toUpperCase()
  let url = resolveUrl(config.url)
  let data = config.data

  if (config.params && ['GET', 'DELETE', 'HEAD'].includes(method)) {
    url = appendQuery(url, config.params)
  } else if (config.params && data === undefined) {
    data = config.params
  }

  return new Promise<UniApp.RequestSuccessCallbackResult>((resolve, reject) => {
    uni.request({
      url,
      method: method as UniApp.RequestOptions['method'],
      data,
      header: config.headers,
      success: (response) => resolve(response),
      fail: (error) => reject(error),
    })
  })
}

request.get = (url: string, config: Omit<H5RequestConfig, 'url' | 'method'> = {}) =>
  request({ ...config, url, method: 'GET' })
request.post = (url: string, data?: unknown, config: Omit<H5RequestConfig, 'url' | 'method' | 'data'> = {}) =>
  request({ ...config, url, method: 'POST', data })
request.put = (url: string, data?: unknown, config: Omit<H5RequestConfig, 'url' | 'method' | 'data'> = {}) =>
  request({ ...config, url, method: 'PUT', data })
request.delete = (url: string, config: Omit<H5RequestConfig, 'url' | 'method'> = {}) =>
  request({ ...config, url, method: 'DELETE' })

export default request

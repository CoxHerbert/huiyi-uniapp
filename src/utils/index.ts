/**
 * 获取当前页面路径
 * @returns 当前页面路径
 */
export function getCurrentPath() {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const route = currentPage?.route || ''
  const options = currentPage?.options || {}
  const query = Object.entries(options)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value ?? ''))}`)
    .join('&')
  return query ? `${route}?${query}` : route
}

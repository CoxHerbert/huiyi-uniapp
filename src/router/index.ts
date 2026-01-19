/// <reference types="@uni-helper/vite-plugin-uni-pages/client" />
import { pages, subPackages } from 'virtual:uni-pages'
import { useAuthStore } from '@/store/auth'

function generateRoutes() {
  const routes = pages.map((page) => {
    const newPath = `/${page.path}`
    return { ...page, path: newPath }
  })
  if (subPackages && subPackages.length > 0) {
    subPackages.forEach((subPackage) => {
      const subRoutes = subPackage.pages.map((page: any) => {
        const newPath = `/${subPackage.root}/${page.path}`
        return { ...page, path: newPath }
      })
      routes.push(...subRoutes)
    })
  }
  return routes
}

const router = createRouter({
  routes: generateRoutes(),
})

const publicRouteNames = new Set(['login'])
function isPublicRoute(route: { name?: string | null, path?: string | null }) {
  if (route.name && publicRouteNames.has(String(route.name)))
    return true
  return Boolean(route.path && route.path.startsWith('/pages/login'))
}

function resolveRedirectPath(route: { path?: string | null, query?: Record<string, any> | null }) {
  const path = route.path || ''
  const query = route.query || {}
  const queryString = Object.entries(query)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value ?? ''))}`)
    .join('&')
  return queryString ? `${path}?${queryString}` : path
}

router.beforeEach((to, from, next) => {
  const auth = useAuthStore()

  // 演示：对受保护页面的简单拦截
  if (!auth.isLogin && !isPublicRoute(to)) {
    const { confirm: showConfirm } = useGlobalMessage()
    const redirect = resolveRedirectPath(to)

    return new Promise<void>((resolve, reject) => {
      showConfirm({
        title: '提示',
        msg: '未登录，请前往登录后访问',
        confirmButtonText: '去登录',
        cancelButtonText: '取消',
        success() {
          next({
            path: '/pages/index/index',
            navType: 'replaceAll',
            query: redirect ? { redirect } : undefined,
          })
          resolve()
        },
        fail() {
          next(false)
          reject(new Error('用户取消访问'))
        },
      })
    })
  }

  // 继续导航
  next()
})

router.afterEach((to, from) => {
  console.log('🎯 afterEach 钩子触发:', { to, from })

  // 演示：简单的页面切换记录
  if (to.path) {
    console.log(`📄 页面切换完成: ${to.path}`)
  }

  // 演示：针对 afterEach 演示页面的简单提示
  if (to.name === 'demo-aftereach') {
    const { show: showToast } = useGlobalToast()
    console.log('📊 进入 afterEach 演示页面')
    setTimeout(() => {
      showToast('afterEach 钩子已触发！')
    }, 500)
  }
})

export default router

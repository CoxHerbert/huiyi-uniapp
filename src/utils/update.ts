let updateManager: UniApp.UpdateManager | null = null
let bound = false
let shouldToastNoUpdate = false

interface UpdateCheckOptions {
  showNoUpdateToast?: boolean
}

export function checkMiniProgramUpdate(options: UpdateCheckOptions = {}) {
  const { showNoUpdateToast = false } = options

  // #ifdef MP-WEIXIN
  if (typeof uni.getUpdateManager !== 'function') {
    if (showNoUpdateToast) {
      uni.showToast({ title: '当前版本不支持更新检查', icon: 'none' })
    }
    return
  }

  if (!updateManager)
    updateManager = uni.getUpdateManager()

  if (showNoUpdateToast)
    shouldToastNoUpdate = true

  if (!bound && updateManager) {
    updateManager.onCheckForUpdate((res) => {
      if (!res.hasUpdate && shouldToastNoUpdate) {
        uni.showToast({ title: '已是最新版本', icon: 'none' })
        shouldToastNoUpdate = false
      }
    })

    updateManager.onUpdateReady(() => {
      uni.showModal({
        title: '更新提示',
        content: '发现新版本，是否重启应用？',
        confirmText: '立即更新',
        success: (res) => {
          if (res.confirm)
            updateManager?.applyUpdate()
        },
      })
    })

    updateManager.onUpdateFailed(() => {
      uni.showToast({ title: '更新失败，请稍后重试', icon: 'none' })
    })

    bound = true
  }
  // #endif

  // #ifndef MP-WEIXIN
  if (showNoUpdateToast)
    uni.showToast({ title: '当前平台不支持更新', icon: 'none' })
  // #endif
}

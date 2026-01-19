<script setup lang="ts">
definePage({
  name: 'index',
  style: {
    navigationBarTitleText: '登录',
  },
})

onLoad((option) => {
  const rawRedirect = option?.redirect ? String(option.redirect) : ''
  const redirect = rawRedirect ? `?redirect=${encodeURIComponent(rawRedirect)}` : ''
  uni.redirectTo({ url: `/pages/login/index${redirect}` })
})
</script>

<template>
  <view class="index-redirect">
    <text>正在跳转到登录...</text>
  </view>
</template>

<style scoped>
.index-redirect {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  font-size: 14px;
}
</style>

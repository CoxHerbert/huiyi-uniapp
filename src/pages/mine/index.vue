<script setup lang="ts">
import { checkMiniProgramUpdate } from '@/utils/update'

definePage({
  name: 'mine',
  layout: 'tabbar',
  style: {
    navigationBarTitleText: '我的',
  },
})

const router = useRouter()
const userStore = useUserStore()
const authStore = useAuthStore()

const {
  currentThemeColor,
  showThemeColorSheet,
  themeColorOptions,
  openThemeColorPicker,
  closeThemeColorPicker,
  selectThemeColor,
} = useManualTheme()

const userInfo = computed<any>(() => userStore.userInfo || {})
const loginInfo = computed<any>(() => userStore.loginInfo || {})

const displayName = computed(() => {
  const user = userInfo.value
  const login = loginInfo.value
  return (
    user.real_name
    || user.realName
    || user.user_name
    || user.userName
    || login.real_name
    || login.realName
    || login.user_name
    || login.userName
    || login.nick_name
    || login.nickName
    || login.account
    || user.account
    || '-'
  )
})

const nickName = computed(() => {
  const user = userInfo.value
  const login = loginInfo.value
  return (
    user.nick_name
    || user.nickName
    || login.nick_name
    || login.nickName
    || ''
  )
})

const employeeNumber = computed(() => {
  const user = userInfo.value
  const login = loginInfo.value
  return (
    user.account
    || user.userCode
    || user.jobNo
    || user.userId
    || user.user_id
    || login.account
    || login.userCode
    || login.jobNo
    || login.userId
    || login.user_id
    || '-'
  )
})

/** 角色：loginInfo.role_name 形如 "administrator,基础用户,..." */
const roleNames = computed<string[]>(() => {
  const raw = loginInfo.value?.role_name
  if (!raw)
    return []
  return String(raw)
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
})

/** 头像：你给的 loginInfo.avatar 为空，这里给个兜底 */
const avatarUrl = computed(() => {
  const user = userInfo.value
  const login = loginInfo.value
  return user.avatar || login.avatar || ''
})

const tenantId = computed(() => loginInfo.value?.tenant_id || userInfo.value?.tenant_id || '')
const deptId = computed(() => loginInfo.value?.dept_id || userInfo.value?.dept_id || '')

// 处理主题色选择
function handleThemeColorSelect(option: any) {
  selectThemeColor(option)
  closeThemeColorPicker()
}

function handleLogout() {
  uni.showModal({
    title: '退出登录',
    content: '确认要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        authStore.logout()
        router.replaceAll({ name: 'login' })
      }
    },
  })
}

function handleCheckUpdate() {
  checkMiniProgramUpdate({ showNoUpdateToast: true })
}
</script>

<template>
  <view class="settings-page">
    <!-- 顶部用户信息卡 -->
    <view class="profile-card">
      <view class="profile-card__bg" />
      <view class="profile-card__content">
        <view class="profile-card__row">
          <view class="profile-card__avatar">
            <image
              v-if="avatarUrl"
              :src="avatarUrl"
              mode="aspectFill"
              class="profile-card__avatar-img"
            />
            <view v-else class="profile-card__avatar-fallback">
              <text class="profile-card__avatar-text">
                {{ String(displayName).slice(0, 1) || '我' }}
              </text>
            </view>
          </view>

          <view class="profile-card__info">
            <view class="profile-card__name-row">
              <text class="profile-card__name">
                {{ displayName }}
              </text>
              <view class="profile-card__badge">
                <view
                  class="profile-card__dot"
                  :style="{ backgroundColor: currentThemeColor.primary }"
                />
                <text class="profile-card__badge-text">
                  {{ currentThemeColor.name }}
                </text>
              </view>
            </view>

            <view class="profile-card__sub">
              <text v-if="nickName" class="profile-card__sub-text">
                昵称：{{ nickName }}
              </text>
              <text class="profile-card__sub-sep">
                ·
              </text>
              <text class="profile-card__sub-text">
                工号：{{ employeeNumber }}
              </text>
            </view>

            <!-- <view v-if="tenantId || deptId" class="profile-card__meta">
              <text v-if="tenantId" class="profile-card__meta-text">
                租户：{{ tenantId }}
              </text>
              <text v-if="tenantId && deptId" class="profile-card__meta-sep">
                ·
              </text>
              <text v-if="deptId" class="profile-card__meta-text">
                部门：{{ deptId }}
              </text>
            </view> -->
          </view>
        </view>

        <view v-if="roleNames.length" class="profile-card__roles">
          <view v-for="(r, idx) in roleNames.slice(0, 6)" :key="`${r}-${idx}`" class="role-tag">
            <text class="role-tag__text">
              {{ r }}
            </text>
          </view>
          <view v-if="roleNames.length > 6" class="role-tag role-tag--more">
            <text class="role-tag__text">
              +{{ roleNames.length - 6 }}
            </text>
          </view>
        </view>
      </view>
    </view>

    <!-- 设置区 -->
    <view class="section">
      <view class="section__title">
        主题设置
      </view>
      <wd-cell-group border custom-class="section__group">
        <wd-cell title="选择主题色" is-link @click="openThemeColorPicker">
          <view class="cell-right">
            <view class="cell-right__color" :style="{ backgroundColor: currentThemeColor.primary }" />
            <text class="cell-right__text">
              {{ currentThemeColor.name }}
            </text>
          </view>
        </wd-cell>
      </wd-cell-group>
    </view>

    <view class="section">
      <view class="section__title">
        账号
      </view>
      <wd-cell-group border custom-class="section__group">
        <wd-cell title="检查更新" is-link @click="handleCheckUpdate">
          <template #icon>
            <wd-icon name="refresh" size="18px" />
          </template>
        </wd-cell>
        <wd-cell title="退出登录" is-link @click="handleLogout">
          <template #icon>
            <wd-icon name="logout" size="18px" />
          </template>
        </wd-cell>
      </wd-cell-group>

      <!-- 更显眼的底部按钮（可选，体验更好） -->
      <view class="logout-btn-wrap">
        <wd-button block type="danger" @click="handleLogout">
          退出登录
        </wd-button>
      </view>
    </view>

    <!-- 主题色选择 ActionSheet -->
    <wd-action-sheet
      v-model="showThemeColorSheet"
      title="选择主题色"
      :close-on-click-action="true"
      @cancel="closeThemeColorPicker"
    >
      <view class="sheet">
        <view
          v-for="option in themeColorOptions"
          :key="option.value"
          class="sheet-item"
          @click="handleThemeColorSelect(option)"
        >
          <view class="sheet-item__left">
            <view class="sheet-item__color" :style="{ backgroundColor: option.primary }" />
            <text class="sheet-item__name">
              {{ option.name }}
            </text>
          </view>

          <wd-icon
            v-if="currentThemeColor.value === option.value"
            name="check"
            :color="option.primary"
            size="20px"
          />
        </view>
      </view>
      <wd-gap :height="40" />
    </wd-action-sheet>
  </view>
</template>

<style scoped>
/* 页面背景与间距 */
.settings-page {
  box-sizing: border-box;
  padding: 12px 12px 24px;
  background: #f6f7f9;
  min-height: 100vh;
}

/* 顶部个人信息卡 */
.profile-card {
  position: relative;
  overflow: hidden;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
  margin-bottom: 14px;
}

.profile-card__bg {
  height: 88px;
  background: linear-gradient(135deg, rgba(63, 95, 255, 0.22), rgba(0, 0, 0, 0));
}

.profile-card__content {
  padding: 14px 14px 14px;
  margin-top: -44px; /* 头像压住渐变背景 */
}

.profile-card__row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.profile-card__avatar {
  width: 66px;
  height: 66px;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-card__avatar-img {
  width: 100%;
  height: 100%;
}

.profile-card__avatar-fallback {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(63, 95, 255, 0.18), rgba(63, 95, 255, 0.04));
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-card__avatar-text {
  font-size: 22px;
  font-weight: 700;
  color: #2a2a2a;
}

.profile-card__info {
  flex: 1;
  min-width: 0;
}

.profile-card__name-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.profile-card__name {
  font-size: 18px;
  font-weight: 700;
  color: #1f2329;
  max-width: 60%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-card__badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.04);
  flex-shrink: 0;
}

.profile-card__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.profile-card__badge-text {
  font-size: 12px;
  color: #3a3f45;
}

.profile-card__sub {
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6b7280;
  font-size: 12px;
  flex-wrap: wrap;
}

.profile-card__sub-sep {
  color: rgba(107, 114, 128, 0.6);
}

.profile-card__meta {
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #8a919a;
  font-size: 12px;
  flex-wrap: wrap;
}

.profile-card__meta-sep {
  color: rgba(138, 145, 154, 0.6);
}

.profile-card__roles {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.role-tag {
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(63, 95, 255, 0.10);
}

.role-tag--more {
  background: rgba(0, 0, 0, 0.05);
}

.role-tag__text {
  font-size: 12px;
  color: #2f3cff;
}

/* 分区卡片 */
.section {
  margin-top: 12px;
}

.section__title {
  font-size: 13px;
  color: #6b7280;
  margin: 8px 4px 8px;
  letter-spacing: 0.2px;
}

/* wd-cell-group 外层圆角 + 阴影（custom-class 生效） */
:deep(.section__group) {
  border-radius: 14px !important;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.05);
}

.cell-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.cell-right__color {
  width: 14px;
  height: 14px;
  border-radius: 999px;
  border: 2px solid rgba(0, 0, 0, 0.08);
}

.cell-right__text {
  color: #1f2329;
  font-size: 13px;
}

/* 底部退出按钮 */
.logout-btn-wrap {
  margin-top: 12px;
}

/* ActionSheet */
.sheet {
  padding: 10px 16px 6px;
}

.sheet-item {
  padding: 12px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.sheet-item:last-child {
  border-bottom: 0;
}

.sheet-item__left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sheet-item__color {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  border: 2px solid rgba(0, 0, 0, 0.10);
}

.sheet-item__name {
  font-size: 14px;
  color: #1f2329;
}
</style>

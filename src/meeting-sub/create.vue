<script setup lang="ts">
import { computed, reactive, ref, watch, watchEffect } from 'vue'
import { createMeeting } from '@/api/meeting'
import { useUserStore } from '@/store/user'
import MeetingForm from './components/MeetingForm.vue'

definePage({
  name: 'meeting-create',
  style: {
    navigationBarTitleText: '创建会议',
  },
})

const userStore = useUserStore()
const loginInfo = computed(() => userStore.loginInfo)
const MEETING_LIST_REFRESH_KEY = 'meeting-list-refresh'

const meetingForm = reactive({
  name: '',
  type: '线上会议',
  hosts: [] as string[],
  participantNames: [] as string[],
  users: [] as Array<{ realName: string, account: string }>,
  hostUser: [] as Array<{ realName: string, account: string }>,
  startTime: '',
  endTime: '',
  date: '',
  duration: '',
  participants: '',
  room: '',
  location: '',
  password: '',
  attachment: '',
  description: '',
})

const MIN_DURATION_MINUTES = 5
const MIN_START_OFFSET_MINUTES = 5
const QUICK_DURATION_OPTIONS = [30, 60, 90, 120]

function padTime(value: number) {
  return String(value).padStart(2, '0')
}

function formatDate(value: Date) {
  const year = value.getFullYear()
  const month = padTime(value.getMonth() + 1)
  const day = padTime(value.getDate())
  return `${year}/${month}/${day}`
}

function formatTime(value: Date) {
  return `${padTime(value.getHours())}:${padTime(value.getMinutes())}`
}

function formatTimeFromMinutes(totalMinutes: number) {
  const clamped = Math.min(Math.max(totalMinutes, 0), 23 * 60 + 59)
  const hour = Math.floor(clamped / 60)
  const minute = clamped % 60
  return `${padTime(hour)}:${padTime(minute)}`
}

function parseTime(time: string) {
  const [hour, minute] = time.split(':').map(Number)
  return {
    hour: Number.isNaN(hour) ? 0 : hour,
    minute: Number.isNaN(minute) ? 0 : minute,
  }
}

function toMinutes(time: string) {
  const { hour, minute } = parseTime(time)
  return hour * 60 + minute
}

function addMinutesToTime(time: string, minutes: number) {
  return formatTimeFromMinutes(toMinutes(time) + minutes)
}

function initDefaultDateTime() {
  const now = new Date()
  meetingForm.date = formatDate(now)
  meetingForm.name = `${loginInfo.value?.real_name || ''}预定的会议`

  const startAt = new Date(now)
  startAt.setSeconds(0, 0)
  startAt.setMinutes(startAt.getMinutes() + MIN_START_OFFSET_MINUTES)
  meetingForm.startTime = formatTime(startAt)
  meetingForm.endTime = addMinutesToTime(meetingForm.startTime, 30)
}

initDefaultDateTime()

function parseDate(value: string) {
  const normalized = value.replace(/-/g, '/')
  const parsed = new Date(normalized)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function parseDateTimeValue(value: string | number) {
  if (typeof value === 'number') {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }
  const normalized = String(value).replace(/-/g, '/')
  const parsed = new Date(normalized)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const meetingDateValue = computed<number>({
  get() {
    const parsed = parseDate(meetingForm.date)
    if (parsed)
      return parsed.getTime()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today.getTime()
  },
  set(value) {
    const parsed = parseDateTimeValue(value)
    if (!parsed)
      return
    meetingForm.date = formatDate(parsed)
  },
})

const minDate = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today.getTime()
})

const timeMinuteFilter = (type: string, values: number[]) => {
  if (type === 'minute')
    return values.filter(value => value % 5 === 0)
  return values
}

const customDurationMinutes = ref('')

function ensureDateNotPast() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const selected = parseDate(meetingForm.date)
  if (!selected || selected.getTime() < today.getTime()) {
    meetingForm.date = formatDate(today)
  }
}

function ensureStartNotPast() {
  if (!meetingForm.startTime)
    return
  const now = new Date()
  const todayLabel = formatDate(now)
  if (meetingForm.date !== todayLabel)
    return
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const minStartMinutes = Math.min(nowMinutes + MIN_START_OFFSET_MINUTES, 23 * 60 + 59)
  if (toMinutes(meetingForm.startTime) < minStartMinutes) {
    meetingForm.startTime = formatTimeFromMinutes(minStartMinutes)
  }
}

function ensureMinimumDuration() {
  if (!meetingForm.startTime || !meetingForm.endTime)
    return
  const minEndMinutes = Math.min(
    toMinutes(meetingForm.startTime) + MIN_DURATION_MINUTES,
    23 * 60 + 59,
  )
  if (toMinutes(meetingForm.endTime) < minEndMinutes) {
    meetingForm.endTime = formatTimeFromMinutes(minEndMinutes)
  }
}

function resolveDefaultStartTime() {
  const now = new Date()
  const todayLabel = formatDate(now)
  if (meetingForm.date === todayLabel) {
    now.setSeconds(0, 0)
    now.setMinutes(now.getMinutes() + MIN_START_OFFSET_MINUTES)
    return formatTime(now)
  }
  return '09:00'
}

function normalizeDuration(minutes: number) {
  if (!Number.isFinite(minutes))
    return null
  const clamped = Math.max(minutes, MIN_DURATION_MINUTES)
  return Math.ceil(clamped / 5) * 5
}

function applyDuration(minutes: number) {
  const normalized = normalizeDuration(minutes)
  if (!normalized) {
    uni.showToast({ title: '请输入有效时长', icon: 'none' })
    return
  }
  if (!meetingForm.date)
    meetingForm.date = formatDate(new Date())
  if (!meetingForm.startTime)
    meetingForm.startTime = resolveDefaultStartTime()
  meetingForm.endTime = addMinutesToTime(meetingForm.startTime, normalized)
}

function applyCustomDuration() {
  const raw = Number(customDurationMinutes.value)
  if (!raw) {
    uni.showToast({ title: '请输入时长（分钟）', icon: 'none' })
    return
  }
  const normalized = normalizeDuration(raw)
  if (!normalized)
    return
  if (normalized !== raw) {
    uni.showToast({ title: `已自动调整为${normalized}分钟`, icon: 'none' })
  }
  customDurationMinutes.value = String(normalized)
  applyDuration(normalized)
}

watch(
  () => [meetingForm.date, meetingForm.startTime, meetingForm.endTime],
  () => {
    ensureDateNotPast()
    ensureStartNotPast()
    ensureMinimumDuration()
  },
  { immediate: true },
)

const meetingStartTimestamp = computed(() => {
  const startAt = new Date(`${meetingForm.date} ${meetingForm.startTime}`)
  return Number.isNaN(startAt.getTime()) ? 0 : Math.floor(startAt.getTime() / 1000)
})

const meetingDurationSeconds = computed(() => {
  const startAt = new Date(`${meetingForm.date} ${meetingForm.startTime}`)
  const endAt = new Date(`${meetingForm.date} ${meetingForm.endTime}`)
  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime()))
    return 0
  const diff = endAt.getTime() - startAt.getTime()
  return diff > 0 ? Math.floor(diff / 1000) : 0
})

const durationLabel = computed(() => {
  const minutes = Math.floor(meetingDurationSeconds.value / 60)
  return `${minutes}分钟`
})

watchEffect(() => {
  meetingForm.duration = durationLabel.value
})

watchEffect(() => {
  if (!meetingForm.hosts.length && loginInfo.value?.account) {
    meetingForm.hosts = [loginInfo.value.account]
  }
})

watchEffect(() => {
  const loginAccount = loginInfo.value?.account
  if (!loginAccount)
    return
  if (!meetingForm.hostUser.length) {
    meetingForm.hostUser = [{
      account: loginAccount,
      realName: loginInfo.value?.real_name || '',
    }]
  }
})

watchEffect(() => {
  const account = loginInfo.value?.account
  if (!account)
    return
  if (!meetingForm.users.some(user => user.account === account)) {
    meetingForm.users = [
      ...meetingForm.users,
      { account, realName: loginInfo.value?.real_name || '' },
    ]
  }
  const ids = meetingForm.users.map(user => user.account).filter(Boolean)
  if (ids.length)
    meetingForm.participants = ids.join(',')
  meetingForm.participantNames = meetingForm.users
    .map(user => user.realName)
    .filter(Boolean)
})

/** 解析参与人字符串（支持 、 , ，） */
function parseUserIds(value: string) {
  return value
    .split(/[、,，]/)
    .map(item => item.trim())
    .filter(Boolean)
}

function buildUsers() {
  const ids = parseUserIds(meetingForm.participants)
  const nameByAccount = new Map<string, string>()

  meetingForm.users.forEach((user) => {
    if (user.account)
      nameByAccount.set(user.account, user.realName)
  })

  meetingForm.participantNames.forEach((name, index) => {
    const account = ids[index]
    if (account && name && !nameByAccount.has(account))
      nameByAccount.set(account, name)
  })

  const loginAccount = loginInfo.value?.account
  if (loginAccount && !nameByAccount.has(loginAccount))
    nameByAccount.set(loginAccount, loginInfo.value?.real_name || '')

  return ids.map(account => ({
    account,
    realName: nameByAccount.get(account) || '',
  }))
}

function buildHostUsers() {
  const accounts = meetingForm.hosts
  const nameByAccount = new Map<string, string>()

  meetingForm.hostUser.forEach((user) => {
    if (user.account)
      nameByAccount.set(user.account, user.realName)
  })

  const loginAccount = loginInfo.value?.account
  if (loginAccount && !nameByAccount.has(loginAccount))
    nameByAccount.set(loginAccount, loginInfo.value?.real_name || '')

  return accounts.map(account => ({
    account,
    realName: nameByAccount.get(account) || '',
  }))
}

/** 转成服务端接收格式（统一在这里维护字段映射） */
function toServerPayload() {
  const users = meetingForm.users.length ? meetingForm.users : buildUsers()
  const hostUser = meetingForm.hostUser.length ? meetingForm.hostUser : buildHostUsers()
  const ids = users.map(user => user.account).filter(Boolean)
  const hostIds = hostUser.map(user => user.account).filter(Boolean)

  return {
    title: meetingForm.name,
    meeting_start: meetingStartTimestamp.value,
    meeting_duration: meetingDurationSeconds.value,
    description: meetingForm.description,
    location: meetingForm.location,
    users: JSON.stringify(users),
    hostUser: JSON.stringify(hostUser),
    invitees: {
      userid: ids,
    },
    settings: {
      password: meetingForm.password,
      host: hostIds,
      remind_scope: 1,
    },
  }
}

const createMeetingPayload = computed(() => toServerPayload())

async function handleCreate() {
  try {
    await createMeeting(createMeetingPayload.value)
    uni.showToast({ title: '预约会议成功', icon: 'none' })
    uni.setStorageSync(MEETING_LIST_REFRESH_KEY, true)
    setTimeout(() => {
      uni.navigateBack()
    }, 800)
  }
  catch (error) {
    console.error('create meeting failed', error)
  }
}
</script>

<template>
  <MeetingForm
    title="创建会议" submit-text="预约会议" :meeting="meetingForm"
    @update:meeting="(value) => Object.assign(meetingForm, value)" @submit="handleCreate"
  >
    <template #time>
      <view class="mb-2 bg-white px-4 py-3">
        <view class="time-picker-grid">
          <view class="time-picker-row">
            <text class="time-label">日期</text>
            <wd-datetime-picker v-model="meetingDateValue" type="date" :min-date="minDate">
              <view class="time-picker-cell">
                <text class="time-value">
                  {{ meetingForm.date || '请选择日期' }}
                </text>
                <wd-icon name="arrow-right" size="14px" color="#c4c7cc" />
              </view>
            </wd-datetime-picker>
          </view>
          <view class="time-picker-row">
            <text class="time-label">开始时间</text>
            <wd-datetime-picker
              v-model="meetingForm.startTime"
              type="time"
              :filter="timeMinuteFilter"
              :use-second="false"
            >
              <view class="time-picker-cell">
                <text class="time-value">
                  {{ meetingForm.startTime || '请选择时间' }}
                </text>
                <wd-icon name="arrow-right" size="14px" color="#c4c7cc" />
              </view>
            </wd-datetime-picker>
          </view>
          <view class="time-picker-row">
            <text class="time-label">结束时间</text>
            <wd-datetime-picker
              v-model="meetingForm.endTime"
              type="time"
              :filter="timeMinuteFilter"
              :use-second="false"
            >
              <view class="time-picker-cell">
                <text class="time-value">
                  {{ meetingForm.endTime || '请选择时间' }}
                </text>
                <wd-icon name="arrow-right" size="14px" color="#c4c7cc" />
              </view>
            </wd-datetime-picker>
          </view>
        </view>
        <view class="mt-3 flex flex-col gap-2">
          <text class="text-3 text-#9aa0a6">
            时间以 5 分钟为单位，结束时间需晚于开始时间
          </text>
          <view class="flex items-center justify-between">
            <view class="duration-shortcuts">
              <text class="shortcut-label">快捷时长</text>
              <view class="shortcut-list">
                <view
                  v-for="minutes in QUICK_DURATION_OPTIONS"
                  :key="minutes"
                  class="shortcut-item"
                  @click.stop="applyDuration(minutes)"
                >
                  {{ minutes }}分钟
                </view>
              </view>
            </view>
            <view class="duration-input-wrap">
              <wd-input
                :model-value="customDurationMinutes"
                type="number"
                placeholder="输入分钟"
                custom-class="duration-input"
                @update:model-value="(value) => customDurationMinutes = value"
              />
              <text class="duration-unit">分钟</text>
              <wd-button size="small" type="primary" @click.stop="applyCustomDuration">
                应用
              </wd-button>
            </view>
          </view>
          <view class="duration-summary">
            <text class="duration-summary__label">当前时长</text>
            <text class="duration-summary__value">{{ durationLabel }}</text>
          </view>
        </view>
      </view>
    </template>
  </MeetingForm>
</template>

<style scoped>
.time-picker-grid {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.time-picker-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24rpx;
}

.time-label {
  font-size: 26rpx;
  color: #8a8f99;
}

.time-picker-cell {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.time-value {
  font-size: 28rpx;
  color: #2f2f2f;
}
.duration-shortcuts {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex-wrap: wrap;
}

.shortcut-label {
  font-size: 24rpx;
  color: #9aa0a6;
}

.shortcut-list {
  display: flex;
  gap: 12rpx;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.shortcut-item {
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  background: #eef2ff;
  font-size: 24rpx;
  color: #4f7bff;
}

.duration-input-wrap {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.duration-input :deep(.wd-input__inner) {
  width: 140rpx;
  text-align: right;
}

.duration-unit {
  font-size: 24rpx;
  color: #9aa0a6;
}

.duration-summary {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 24rpx;
  color: #5f6368;
}

.duration-summary__value {
  font-weight: 600;
  color: #2f2f2f;
}
</style>

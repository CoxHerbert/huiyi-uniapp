<script setup lang="ts">
import { computed, reactive, watch, watchEffect } from 'vue'
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
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const startMinutes = Math.min(nowMinutes + MIN_START_OFFSET_MINUTES, 23 * 60 + 59)
  meetingForm.date = formatDate(now)
  meetingForm.startTime = formatTimeFromMinutes(startMinutes)
  meetingForm.endTime = addMinutesToTime(meetingForm.startTime, MIN_DURATION_MINUTES)
  meetingForm.name = `${loginInfo.value?.real_name || ''}预定的会议`
}

initDefaultDateTime()

const minStartDateTime = computed(() => {
  const now = new Date()
  now.setSeconds(0, 0)
  now.setMinutes(now.getMinutes() + MIN_START_OFFSET_MINUTES)
  return now.getTime()
})

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

function displayRangeFormat(items: Record<string, any>[]) {
  if (!items.length)
    return ''
  const [year, month, date, hour, minute] = items
  return `${year.label}/${month.label}/${date.label} ${hour.label}:${minute.label}`
}

const meetingRange = computed<[number, number]>({
  get() {
    if (!meetingForm.date || !meetingForm.startTime || !meetingForm.endTime)
      return [0, 0]
    const startAt = new Date(`${meetingForm.date} ${meetingForm.startTime}`)
    const endAt = new Date(`${meetingForm.date} ${meetingForm.endTime}`)
    return [startAt.getTime(), endAt.getTime()]
  },
  set(value) {
    if (!Array.isArray(value) || value.length < 2)
      return
    const [startValue, endValue] = value
    const startAt = parseDateTimeValue(startValue)
    const endAt = parseDateTimeValue(endValue)
    if (!startAt || !endAt)
      return
    meetingForm.date = formatDate(startAt)
    meetingForm.startTime = formatTime(startAt)
    meetingForm.endTime = formatTime(endAt)
  },
})

function validateRangeSelection(
  value: Array<string | number>,
  resolve: (isPass: boolean) => void,
) {
  if (!Array.isArray(value) || value.length < 2) {
    resolve(false)
    return
  }
  const [startValue, endValue] = value
  const startAt = parseDateTimeValue(startValue)
  const endAt = parseDateTimeValue(endValue)
  if (!startAt || !endAt) {
    resolve(false)
    return
  }
  const diff = endAt.getTime() - startAt.getTime()
  if (diff < MIN_DURATION_MINUTES * 60 * 1000) {
    uni.showToast({ title: `结束时间需晚于开始时间至少${MIN_DURATION_MINUTES}分钟`, icon: 'none' })
    resolve(false)
    return
  }
  resolve(true)
}

function ensureDateNotPast() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const selected = parseDate(meetingForm.date)
  if (!selected || selected.getTime() < today.getTime()) {
    meetingForm.date = formatDate(today)
  }
}

function ensureStartNotPast() {
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
  const minEndMinutes = Math.min(
    toMinutes(meetingForm.startTime) + MIN_DURATION_MINUTES,
    23 * 60 + 59,
  )
  if (toMinutes(meetingForm.endTime) < minEndMinutes) {
    meetingForm.endTime = formatTimeFromMinutes(minEndMinutes)
  }
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
        <wd-datetime-picker
          v-model="meetingRange"
          type="datetime"
          :use-second="false"
          :min-date="minStartDateTime"
          :display-format="displayRangeFormat"
          :before-confirm="validateRangeSelection"
        >
          <view class="flex items-center justify-center">
            <view class="flex items-center gap-6">
              <view class="text-center">
                <text class="block text-5 text-#2f2f2f font-600">
                  {{ meetingForm.startTime }}
                </text>
                <text class="text-3 text-#9aa0a6">
                  {{ meetingForm.date }}
                </text>
              </view>
              <view class="duration-wrap gap-3">
                <view class="line" />
                <text class="duration-text">
                  {{ durationLabel }}
                </text>
                <view class="line" />
              </view>

              <view class="text-center">
                <text class="block text-5 text-#2f2f2f font-600">
                  {{ meetingForm.endTime }}
                </text>
                <text class="text-3 text-#9aa0a6">
                  {{ meetingForm.date }}
                </text>
              </view>
            </view>
          </view>
        </wd-datetime-picker>
      </view>
    </template>
  </MeetingForm>
</template>

<style scoped>
.duration-wrap {
  padding: 0 16rpx;
  display: flex;
  align-items: center;
}
.line {
  width: 56rpx;
  height: 2rpx;
  background: #DADBE0;
}
.duration-text {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 108rpx;
  height: 56rpx;
  background: #F6F8FA;
  border-radius: 8rpx;
  font-size: 24rpx;
  color: #333333;
  line-height: 24rpx;
}
</style>

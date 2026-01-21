<script setup lang="ts">
import { computed, reactive, ref, watch, watchEffect } from 'vue'
import { getMeetingInfo, updateMeeting } from '@/api/meeting'
import { useUserStore } from '@/store/user'
import MeetingForm from './components/MeetingForm.vue'

definePage({
  name: 'meeting-edit',
  style: {
    navigationBarTitleText: '编辑会议',
  },
})

interface MeetingMember {
  userid?: string
}

interface MeetingInfoApi {
  title?: string
  meeting_start?: number
  meeting_duration?: number
  location?: string
  description?: string
  attendees?: { member?: MeetingMember[] }
  settings?: { password?: string, host?: string[] }
  userName?: any
  users?: any
  hostUser?: any
}

const meetingId = ref('')
const pageId = ref('')
const hostUserArr = ref('')
const MEETING_LIST_REFRESH_KEY = 'meeting-list-refresh'
const MEETING_DETAIL_REFRESH_KEY = 'meeting-detail-refresh'
const userStore = useUserStore()
const loginInfo = computed(() => userStore.loginInfo)

const meetingForm = reactive({
  name: '',
  type: '',
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

const timePickerFilter = (type: string, values: number[]) => {
  if (type === 'minute')
    return values.filter(value => value % 5 === 0)
  if (type === 'hour') {
    const todayLabel = formatDate(new Date())
    if (meetingForm.date === todayLabel) {
      const nowHour = new Date().getHours()
      return values.filter(value => value >= nowHour)
    }
  }
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

function ensureEndAfterStart() {
  if (!meetingForm.startTime || !meetingForm.endTime)
    return
  if (toMinutes(meetingForm.endTime) <= toMinutes(meetingForm.startTime)) {
    const minEndMinutes = Math.min(
      toMinutes(meetingForm.startTime) + MIN_DURATION_MINUTES,
      23 * 60 + 59,
    )
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
    ensureEndAfterStart()
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

/** 解析参与人字符串（支持 、 , ，） */
function parseUserIds(value: string) {
  return value
    .split(/[、,，]/)
    .map(item => item.trim())
    .filter(Boolean)
}

function parseUserNames(input: any): string[] {
  if (input === null || input === undefined || input === '')
    return []

  if (Array.isArray(input))
    return input.map((x: any) => String(x)).filter(Boolean)

  if (typeof input === 'string') {
    const str = input.trim()
    if (!str)
      return []

    if (str.startsWith('[')) {
      try {
        const arr = JSON.parse(str)
        if (Array.isArray(arr))
          return arr.map((x: any) => String(x)).filter(Boolean)
      }
      catch (e) {
        // ignore
      }
    }

    return str.split(/[,，]/).map(s => s.trim()).filter(Boolean)
  }

  return [String(input)].filter(Boolean)
}

function parseUsers(input: any): Array<{ realName: string, account: string }> {
  if (!input)
    return []

  if (Array.isArray(input)) {
    return input
      .map((item: any) => ({
        realName: String(item?.realName ?? '').trim(),
        account: String(item?.account ?? '').trim(),
      }))
      .filter(item => item.realName || item.account)
  }

  if (typeof input === 'string') {
    const text = input.trim()
    if (!text)
      return []
    try {
      const parsed = JSON.parse(text)
      if (Array.isArray(parsed)) {
        return parsed
          .map((item: any) => ({
            realName: String(item?.realName ?? '').trim(),
            account: String(item?.account ?? '').trim(),
          }))
          .filter(item => item.realName || item.account)
      }
    }
    catch (error) {
      return []
    }
  }

  return []
}

function parseHostUsers(input: any): Array<{ realName: string, account: string }> {
  return parseUsers(input)
}

function shouldFilterAttendee(userid?: string) {
  return typeof userid === 'string' && /^EW-M[1-6]$/.test(userid)
}

function resolveAttendeeIds(attendees?: { member?: MeetingMember[] }) {
  const members = attendees?.member ?? []
  return Array.isArray(members)
    ? members
        .map(item => item?.userid)
        .filter(userid => !shouldFilterAttendee(userid))
        .filter((value): value is string => !!value)
    : []
}

function applyMeetingToForm(data: MeetingInfoApi) {
  const startSec = Number(data.meeting_start || 0)
  const durationSec = Number(data.meeting_duration || 0)
  const start = startSec ? new Date(startSec * 1000) : null

  if (start) {
    meetingForm.date = formatDate(start)
    meetingForm.startTime = formatTime(start)
    const end = durationSec ? new Date((startSec + durationSec) * 1000) : null
    meetingForm.endTime = end ? formatTime(end) : addMinutesToTime(meetingForm.startTime, MIN_DURATION_MINUTES)
  }

  meetingForm.name = data.title ?? ''
  const hostUsers = parseHostUsers(hostUserArr.value)
  if (hostUsers.length) {
    meetingForm.hostUser = hostUsers
    meetingForm.hosts = hostUsers.map(user => user.account).filter(Boolean)
  }
  else {
    meetingForm.hosts = data.settings?.host ?? []
    meetingForm.hostUser = meetingForm.hosts.map(account => ({
      account,
      realName: '',
    }))
  }
  meetingForm.location = data.location ?? ''
  meetingForm.description = data.description ?? ''
  meetingForm.password = data.settings?.password ?? ''

  const users = parseUsers(data.users)
  if (users.length) {
    meetingForm.users = users
    meetingForm.participants = users.map(user => user.account).filter(Boolean).join(',')
    meetingForm.participantNames = users.map(user => user.realName).filter(Boolean)
  }
  else {
    const attendeeIds = resolveAttendeeIds(data.attendees)
    const names = parseUserNames(data.userName)
    meetingForm.participants = attendeeIds.join(',')
    meetingForm.participantNames = names
    meetingForm.users = attendeeIds.map((account, index) => ({
      account,
      realName: names[index] || '',
    }))
  }
}

async function loadMeetingInfo() {
  if (!meetingId.value)
    return
  try {
    const res: any = await getMeetingInfo(meetingId.value)
    const data: MeetingInfoApi = res?.data?.data || res?.data || {}
    applyMeetingToForm(data)
  }
  catch (error) {
    console.error('fetch meeting info failed', error)
    uni.showToast({ title: '获取会议详情失败', icon: 'none' })
  }
}

/** 转成服务端接收格式（统一在这里维护字段映射） */
function toServerPayload() {
  const fallbackIds = parseUserIds(meetingForm.participants)
  const users = meetingForm.users.length
    ? meetingForm.users
    : fallbackIds.map(account => ({ account, realName: '' }))
  const hostUser = meetingForm.hostUser.length
    ? meetingForm.hostUser
    : meetingForm.hosts.map(account => ({ account, realName: '' }))
  const ids = users.map(user => user.account).filter(Boolean)
  const hostIds = hostUser.map(user => user.account).filter(Boolean)

  return {
    id: pageId.value,
    meetingId: meetingId.value,
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
    },
  }
}

const updateMeetingPayload = computed(() => toServerPayload())

async function handleSave() {
  try {
    await updateMeeting(updateMeetingPayload.value)
    uni.showToast({ title: '会议已更新', icon: 'none' })
    uni.setStorageSync(MEETING_LIST_REFRESH_KEY, true)
    uni.setStorageSync(MEETING_DETAIL_REFRESH_KEY, true)
    setTimeout(() => {
      uni.navigateBack()
    }, 800)
  }
  catch (error) {
    console.error('update meeting failed', error)
    uni.showToast({ title: '更新会议失败', icon: 'none' })
  }
}

onLoad((options) => {
  if (options?.meetingId) {
    meetingId.value = String(options.meetingId)
    pageId.value = String(options.id)
    hostUserArr.value = options.hostUserStr
  }

  loadMeetingInfo()
})
</script>

<template>
  <MeetingForm
    title="编辑会议" submit-text="保存" :meeting="meetingForm"
    @update:meeting="(value) => Object.assign(meetingForm, value)" @submit="handleSave"
  >
    <template #time>
      <view class="mb-2 border-#f0f1f2 bg-white px-4 py-3">
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
        </view>
        <view class="mt-3">
          <view class="flex items-center justify-center">
            <view class="flex items-center gap-6">
            <wd-datetime-picker
              v-model="meetingForm.startTime"
              type="time"
              :filter="timePickerFilter"
              :use-second="false"
            >
                <view class="text-center">
                  <text class="block text-5 text-#2f2f2f font-600">
                    {{ meetingForm.startTime || '--:--' }}
                  </text>
                  <text class="text-3 text-#9aa0a6">
                    {{ meetingForm.date }}
                  </text>
                </view>
              </wd-datetime-picker>
              <view class="duration-wrap gap-4">
                <view class="line" />
                <text class="duration-text">
                  {{ durationLabel }}
                </text>
                <view class="line" />
              </view>
            <wd-datetime-picker
              v-model="meetingForm.endTime"
              type="time"
              :filter="timePickerFilter"
              :use-second="false"
            >
                <view class="text-center">
                  <text class="block text-5 text-#2f2f2f font-600">
                    {{ meetingForm.endTime || '--:--' }}
                  </text>
                  <text class="text-3 text-#9aa0a6">
                    {{ meetingForm.date }}
                  </text>
                </view>
              </wd-datetime-picker>
            </view>
          </view>
        </view>
        <view class="mt-3 flex flex-col gap-2">
          <text class="text-3 text-#9aa0a6">
            时间以 5 分钟为单位，结束时间需晚于开始时间
          </text>
          <view class="duration-actions">
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
              <text class="shortcut-label">自定义</text>
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
  justify-content: flex-end;
}

.duration-input :deep(.wd-input__inner) {
  width: 140rpx;
  text-align: right;
}

.duration-unit {
  font-size: 24rpx;
  color: #9aa0a6;
}

.duration-actions {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}
</style>

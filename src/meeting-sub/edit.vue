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
              <view class="duration-label gap-4">
                <view class="line" />
                <text class="block bg-#F6F8FA px-1 py-2 text-3 text-#9aa0a6">
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
.duration-label {
  padding: 0 16rpx;
  display: flex;
  align-items: center;
}

.line {
  width: 56rpx;
  height: 2rpx;
  background: #DADBE0;
}
</style>

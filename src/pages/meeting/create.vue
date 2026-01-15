<script setup lang="ts">
import { createMeeting } from '@/api/meeting'
import MeetingForm from './components/MeetingForm.vue'

definePage({
  name: 'meeting-create',
  style: {
    navigationBarTitleText: '创建会议',
  },
})

const meetingForm = reactive({
  name: '张浩预定的会议',
  type: '线上会议',
  adminUserid: 'EW-M1',
  startTime: '',
  endTime: '',
  date: '',
  duration: '60分钟',
  participants: 'EW-M1,EW-6504',
  room: '',
  location: '',
  password: '',
  attachment: '',
  description: '',
})

const MIN_DURATION_MINUTES = 5

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
  meetingForm.startTime = formatTime(now)
  meetingForm.endTime = addMinutesToTime(meetingForm.startTime, 30)
}

initDefaultDateTime()

const minEndTime = computed(() => {
  const minTime = addMinutesToTime(meetingForm.startTime, MIN_DURATION_MINUTES)
  const { hour, minute } = parseTime(minTime)
  return { hour, minute }
})

function parseDate(value: string) {
  const normalized = value.replace(/-/g, '/')
  const parsed = new Date(normalized)
  return Number.isNaN(parsed.getTime()) ? null : parsed
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
  if (toMinutes(meetingForm.startTime) < nowMinutes) {
    meetingForm.startTime = formatTime(now)
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

function parseUserIds(value: string) {
  return value
    .split(/[、,，]/)
    .map(item => item.trim())
    .filter(Boolean)
}

const invitees = computed(() => parseUserIds(meetingForm.participants))

const createMeetingPayload = computed(() => ({
  admin_userid: meetingForm.adminUserid,
  title: meetingForm.name,
  meeting_start: meetingStartTimestamp.value,
  meeting_duration: meetingDurationSeconds.value,
  description: meetingForm.description,
  location: meetingForm.location,
  invitees: {
    userid: invitees.value.length ? invitees.value : [meetingForm.adminUserid],
  },
  settings: {
    password: meetingForm.password,
    remind_scope: 1,
  },
}))

async function handleCreate() {
  try {
    if (!meetingForm.adminUserid) {
      uni.showToast({ title: '请选择管理员', icon: 'none' })
      return
    }
    await createMeeting(createMeetingPayload.value)
  }
  catch (error) {
    console.error('create meeting failed', error)
  }
}
</script>

<template>
  <MeetingForm
    title="创建会议"
    submit-text="预约会议"
    :meeting="meetingForm"
    @update:meeting="(value) => Object.assign(meetingForm, value)"
    @submit="handleCreate"
  >
    <template #time>
      <view class="border-b border-#f0f1f2 px-4 py-4">
        <view class="mb-4 flex items-center justify-between">
          <text class="text-3 text-#8a8f99">
            会议日期
          </text>
          <wd-datetime-picker v-model="meetingForm.date" type="date">
            <view class="flex items-center gap-2">
              <text class="text-3 text-#2f2f2f">
                {{ meetingForm.date }}
              </text>
              <wd-icon name="arrow-right" size="14px" color="#c4c7cc" />
            </view>
          </wd-datetime-picker>
        </view>
        <view class="flex items-center justify-between">
          <view class="flex items-center gap-6">
            <view class="text-center">
              <wd-datetime-picker v-model="meetingForm.startTime" type="time" :use-second="false">
                <view class="text-center">
                  <text class="block text-5 text-#2f2f2f font-600">
                    {{ meetingForm.startTime }}
                  </text>
                  <text class="text-2.5 text-#9aa0a6">
                    {{ meetingForm.date }}
                  </text>
                </view>
              </wd-datetime-picker>
            </view>
            <view class="text-center">
              <text class="block text-2.5 text-#9aa0a6">
                {{ durationLabel }}
              </text>
            </view>
            <view class="text-center">
              <wd-datetime-picker
                v-model="meetingForm.endTime"
                type="time"
                :use-second="false"
                :min-hour="minEndTime.hour"
                :min-minute="minEndTime.minute"
              >
                <view class="text-center">
                  <text class="block text-5 text-#2f2f2f font-600">
                    {{ meetingForm.endTime }}
                  </text>
                  <text class="text-2.5 text-#9aa0a6">
                    {{ meetingForm.date }}
                  </text>
                </view>
              </wd-datetime-picker>
            </view>
          </view>
        </view>
      </view>
    </template>
  </MeetingForm>
</template>

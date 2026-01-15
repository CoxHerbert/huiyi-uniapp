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
  startTime: '14:00',
  endTime: '15:00',
  date: '2026/01/15',
  duration: '60分钟',
  participants: 'EW-M1,EW-6504',
  room: '',
  location: '',
  password: '',
  attachment: '',
  description: '',
})

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

const minEndTime = computed(() => {
  const { hour, minute } = parseTime(meetingForm.startTime)
  return { hour, minute }
})

function ensureEndAfterStart() {
  if (toMinutes(meetingForm.endTime) < toMinutes(meetingForm.startTime)) {
    meetingForm.endTime = meetingForm.startTime
  }
}

watch(
  () => [meetingForm.startTime, meetingForm.endTime],
  ensureEndAfterStart,
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
  admin_userid: 'EW-M1',
  title: meetingForm.name,
  meeting_start: meetingStartTimestamp.value,
  meeting_duration: meetingDurationSeconds.value,
  description: meetingForm.description,
  location: meetingForm.location,
  invitees: {
    userid: invitees.value.length ? invitees.value : ['EW-M1'],
  },
  settings: {
    password: meetingForm.password,
    remind_scope: 1,
  },
}))

async function handleCreate() {
  try {
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

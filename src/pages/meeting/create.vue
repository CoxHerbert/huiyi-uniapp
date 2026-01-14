<script setup lang="ts">
import { createMeeting } from '@/api/meeting'
import MeetingForm from './components/MeetingForm.vue'

definePage({
  name: 'meeting-create',
  style: {
    navigationBarTitleText: '创建会议',
  },
})

const meetingDate = ref('2026/01/09')
const startTime = ref('14:00')
const endTime = ref('15:00')

const meetingStartTimestamp = computed(() => {
  const startAt = new Date(`${meetingDate.value} ${startTime.value}`)
  return Number.isNaN(startAt.getTime()) ? 0 : Math.floor(startAt.getTime() / 1000)
})

const meetingDurationSeconds = computed(() => {
  const startAt = new Date(`${meetingDate.value} ${startTime.value}`)
  const endAt = new Date(`${meetingDate.value} ${endTime.value}`)
  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime()))
    return 0
  const diff = endAt.getTime() - startAt.getTime()
  return diff > 0 ? Math.floor(diff / 1000) : 0
})

const durationLabel = computed(() => {
  const minutes = Math.floor(meetingDurationSeconds.value / 60)
  return `${minutes}分钟`
})

const meetingInfo = computed(() => ({
  name: '张浩预定的会议',
  type: '线下会议',
  startTime: startTime.value,
  endTime: endTime.value,
  date: meetingDate.value,
  duration: durationLabel.value,
  participants: '张浩',
  room: '',
  location: '',
  password: '',
  attachment: '',
  description: '',
}))

const createMeetingPayload = computed(() => ({
  admin_userid: 'EW-M1',
  title: 'TEST',
  meeting_start: meetingStartTimestamp.value,
  meeting_duration: meetingDurationSeconds.value,
  invitees: {
    userid: ['EW-7223', 'EW-M1'],
  },
}))

const handleCreate = async () => {
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
    :meeting="meetingInfo"
    @submit="handleCreate"
  >
    <template #time>
      <view class="border-b border-#f0f1f2 px-4 py-4">
        <view class="flex items-center justify-between">
          <view class="flex items-center gap-6">
            <view class="text-center">
              <wd-datetime-picker v-model="startTime" type="time" :use-second="false">
                <view class="text-center">
                  <text class="block text-5 font-600 text-#2f2f2f">{{ startTime }}</text>
                  <text class="text-2.5 text-#9aa0a6">{{ meetingDate }}</text>
                </view>
              </wd-datetime-picker>
            </view>
            <view class="text-center">
              <text class="block text-2.5 text-#9aa0a6">{{ durationLabel }}</text>
            </view>
            <view class="text-center">
              <wd-datetime-picker v-model="endTime" type="time" :use-second="false">
                <view class="text-center">
                  <text class="block text-5 font-600 text-#2f2f2f">{{ endTime }}</text>
                  <text class="text-2.5 text-#9aa0a6">{{ meetingDate }}</text>
                </view>
              </wd-datetime-picker>
            </view>
          </view>
        </view>
      </view>
    </template>
  </MeetingForm>
</template>

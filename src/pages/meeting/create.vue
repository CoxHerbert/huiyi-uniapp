<script setup lang="ts">
import { createMeeting } from '@/api/meeting'
import MeetingForm from './components/MeetingForm.vue'

definePage({
  name: 'meeting-create',
  style: {
    navigationBarTitleText: '创建会议',
  },
})

const meetingInfo = {
  name: '张浩预定的会议',
  type: '线下会议',
  startTime: '14:00',
  endTime: '15:00',
  date: '2026/01/09',
  duration: '60分钟',
  participants: '张浩',
  room: '',
  location: '',
  password: '',
  attachment: '',
  description: '',
}

const createMeetingPayload = {
  admin_userid: 'EW-M1',
  title: 'TEST',
  meeting_start: 1767789614,
  meeting_duration: 300,
  invitees: {
    userid: ['EW-7223', 'EW-M1'],
  },
}

const handleCreate = async () => {
  try {
    await createMeeting(createMeetingPayload)
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
  />
</template>

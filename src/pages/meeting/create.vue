<script setup lang="ts">
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

const handleCreate = () => {
  // TODO: POST /blade-bip/wx/create
  // 当前仅保留接口字段示例，等待后端联调时接入。
  console.log('create meeting payload', createMeetingPayload)
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

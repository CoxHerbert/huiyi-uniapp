<script setup lang="ts">
import MeetingForm from './components/MeetingForm.vue'

definePage({
  name: 'meeting-edit',
  style: {
    navigationBarTitleText: '编辑会议',
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
  room: 'XX会议室',
  location: 'XXXX地点',
  password: '333333',
  attachment: '',
  description: 'XXXXXXXX',
}
</script>

<template>
  <MeetingForm title="编辑会议" submit-text="保存" :meeting="meetingInfo" />
</template>

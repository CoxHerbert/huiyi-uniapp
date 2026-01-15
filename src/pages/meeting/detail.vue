<script setup lang="ts">
definePage({
  name: 'meeting-detail',
  style: {
    navigationBarTitleText: '会议详情',
  },
})

import { cancelMeeting, getMeetingInfo } from '@/api/meeting'

const meetingDetail = {
  title: '张浩预定的会议',
  startTime: '14:00',
  endTime: '13:00',
  date: '2026年01月08日',
  timezone: '(GMT+08:00) 中国标准时间 北京',
  host: '张浩',
  attendees: ['张浩', '张浩', '张浩', '张浩'],
  meetingNo: '668 153 256',
  tipTitle: '温馨提示',
  tipContent: '此小程序仅作会议预约，请从企业微信“会议”功能进入会议。',
}

const meetingId = ref('meetingId')

const loadMeetingDetail = async () => {
  try {
    await getMeetingInfo(meetingId.value)
  }
  catch (error) {
    console.error('fetch meeting detail failed', error)
  }
}

onLoad((options) => {
  if (options?.meetingId) {
    meetingId.value = options.meetingId
  }
  loadMeetingDetail()
})

const goToEdit = () => {
  uni.navigateTo({ url: '/pages/meeting/edit' })
}

const handleCancelMeeting = async () => {
  try {
    await cancelMeeting(meetingId.value)
  }
  catch (error) {
    console.error('cancel meeting failed', error)
  }
}
</script>

<template>
  <view class="min-h-screen bg-#f6f7f9 pb-24">
    <view class="mx-4 mt-4 rounded-4 bg-white px-4 pt-4">
      <text class="block text-3.5 text-#2f2f2f">{{ meetingDetail.title }}</text>

      <view class="mt-4 flex items-center justify-between">
        <view class="text-center">
          <text class="block text-5 font-600 text-#2f2f2f">{{ meetingDetail.startTime }}</text>
          <text class="text-2.5 text-#9aa0a6">{{ meetingDetail.date }}</text>
        </view>
        <view class="text-center">
          <text class="block text-2.5 text-#9aa0a6">60分钟</text>
        </view>
        <view class="text-center">
          <text class="block text-5 font-600 text-#2f2f2f">{{ meetingDetail.endTime }}</text>
          <text class="text-2.5 text-#9aa0a6">{{ meetingDetail.date }}</text>
        </view>
      </view>

      <text class="mt-2 block text-center text-2.5 text-#9aa0a6">
        {{ meetingDetail.timezone }}
      </text>
    </view>

    <view class="mx-4 mt-3 rounded-4 bg-white">
      <view class="flex items-center justify-between border-b border-#f0f1f2 px-4 py-4">
        <text class="text-3 text-#8a8f99">发起人</text>
        <view class="flex items-center gap-2">
          <view class="h-7 w-7 rounded-2 bg-#d9dce1" />
          <text class="text-3 text-#2f2f2f">{{ meetingDetail.host }}</text>
          <wd-icon name="arrow-right" size="14px" color="#c4c7cc" />
        </view>
      </view>
      <view class="flex items-center justify-between border-b border-#f0f1f2 px-4 py-4">
        <text class="text-3 text-#8a8f99">参会人</text>
        <view class="flex items-center gap-2">
          <view class="flex">
            <view
              v-for="(person, index) in meetingDetail.attendees"
              :key="`${person}-${index}`"
              class="-ml-1 h-7 w-7 rounded-2 border-2 border-white bg-#4f7bff"
            />
          </view>
          <wd-icon name="arrow-right" size="14px" color="#c4c7cc" />
        </view>
      </view>
      <view class="flex items-center justify-between px-4 py-4">
        <text class="text-3 text-#8a8f99">会议号</text>
        <text class="text-3 text-#2f2f2f">{{ meetingDetail.meetingNo }}</text>
      </view>
    </view>

    <view class="mx-4 mt-6 rounded-4 bg-white px-6 py-5 text-center">
      <text class="block text-3 text-#8a8f99">{{ meetingDetail.tipTitle }}</text>
      <text class="mt-2 block text-2.5 text-#c2c6cc">{{ meetingDetail.tipContent }}</text>
    </view>

    <view class="fixed bottom-0 left-0 right-0 z-10 border-t border-#f0f1f2 bg-white px-4 py-3 pb-[calc(12px+env(safe-area-inset-bottom))]">
      <view class="flex gap-3">
        <wd-button type="default" plain block @click="handleCancelMeeting">取消会议</wd-button>
        <wd-button type="primary" block @click="goToEdit">编辑会议</wd-button>
      </view>
    </view>
  </view>
</template>

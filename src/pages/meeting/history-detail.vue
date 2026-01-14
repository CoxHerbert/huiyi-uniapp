<script setup lang="ts">
definePage({
  name: 'meeting-history-detail',
  style: {
    navigationBarTitleText: '历史会议详情',
  },
})

const historyDetail = {
  title: '张浩预定的会议',
  timeRange: '2026年01月08日 10:00-10:30',
  meetingNo: '66 153 256',
  host: '张浩',
  attendees: ['张浩', '张浩', '张浩', '张浩', '张浩', '张浩'],
  joinTime: '01/08 10:02',
  duration: '00:10:15',
}
</script>

<template>
  <view class="min-h-screen bg-#f6f7f9">
    <view class="mx-4 mt-4 rounded-4 bg-white px-4 py-4">
      <text class="block text-3.5 text-#2f2f2f">{{ historyDetail.title }}</text>
      <text class="mt-2 block text-2.5 text-#9aa0a6">{{ historyDetail.timeRange }}</text>
      <text class="mt-1 block text-2.5 text-#9aa0a6">会议号：{{ historyDetail.meetingNo }}</text>

      <view class="mt-4 border-t border-#f0f1f2 pt-4">
        <view class="flex items-center justify-between py-2">
          <text class="text-3 text-#8a8f99">发起人</text>
          <view class="flex items-center gap-2">
            <view class="h-7 w-7 rounded-2 bg-#d9dce1" />
            <text class="text-3 text-#2f2f2f">{{ historyDetail.host }}</text>
            <wd-icon name="arrow-right" size="14px" color="#c4c7cc" />
          </view>
        </view>
        <view class="flex items-center justify-between py-2">
          <text class="text-3 text-#8a8f99">参会人</text>
          <view class="flex items-center gap-2">
            <view class="flex">
              <view
                v-for="(person, index) in historyDetail.attendees"
                :key="`${person}-${index}`"
                class="-ml-1 h-7 w-7 rounded-2 border-2 border-white bg-#4f7bff"
              />
            </view>
            <text class="text-2.5 text-#9aa0a6">共{{ historyDetail.attendees.length }}人</text>
            <wd-icon name="arrow-right" size="14px" color="#c4c7cc" />
          </view>
        </view>
      </view>
    </view>

    <view class="mx-4 mt-4 rounded-4 bg-white">
      <view class="flex items-center justify-between px-6 py-4">
        <view class="text-center">
          <text class="block text-3.5 text-#2f2f2f">{{ historyDetail.joinTime }}</text>
          <text class="mt-1 block text-2.5 text-#9aa0a6">入会时间</text>
        </view>
        <view class="h-6 w-px bg-#f0f1f2" />
        <view class="text-center">
          <text class="block text-3.5 text-#2f2f2f">{{ historyDetail.duration }}</text>
          <text class="mt-1 block text-2.5 text-#9aa0a6">入会时长</text>
        </view>
      </view>
    </view>
  </view>
</template>

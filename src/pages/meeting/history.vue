<script setup lang="ts">
definePage({
  name: 'meeting-history',
  style: {
    navigationBarTitleText: '历史会议',
  },
})

const historySections = [
  {
    date: '1月9日 周五',
    year: '2026年',
    items: [
      {
        id: 101,
        title: '会议名称会议名称',
        time: '14:00-15:00',
        meetingNo: '668 153 256',
      },
      {
        id: 102,
        title: '会议名称会议名称',
        time: '14:00-15:00',
        meetingNo: '668 153 256',
      },
    ],
  },
]

const goToHistoryDetail = (meetingId: number) => {
  uni.navigateTo({ url: `/pages/meeting/history-detail?meetingId=${meetingId}` })
}
</script>

<template>
  <view class="min-h-screen bg-#f6f7f9">
    <view class="mx-4 mt-3 rounded-4 bg-white px-3 py-2">
      <view class="flex items-center gap-2 rounded-3 bg-#f3f4f6 px-3 py-2">
        <wd-icon name="search" size="16px" color="#9aa0a6" />
        <text class="text-2.5 text-#9aa0a6">会议名称、会议号、发起人</text>
      </view>
    </view>

    <view class="mx-4 mt-4">
      <view v-for="section in historySections" :key="section.date" class="mb-4">
        <view class="flex items-center justify-between text-2.5 text-#9aa0a6">
          <text>{{ section.date }}</text>
          <text>{{ section.year }}</text>
        </view>
        <view
          v-for="item in section.items"
          :key="item.id"
          class="mt-3 rounded-4 bg-white px-4 py-3"
          @click="goToHistoryDetail(item.id)"
        >
          <text class="block text-3.5 text-#2f2f2f">{{ item.title }}</text>
          <view class="mt-2 flex items-center justify-between text-2.5 text-#9aa0a6">
            <text>{{ item.time }}</text>
            <text>会议号：{{ item.meetingNo }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

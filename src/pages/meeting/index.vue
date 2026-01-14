<script setup lang="ts">
import { getMeetingList } from '@/api/meeting'

definePage({
  name: 'meeting',
  style: {
    navigationBarTitleText: '会议',
  },
})

const meetingSections = ref([
  {
    date: '今天 1月8日',
    items: [
      {
        id: 1,
        status: '待开始',
        statusClass: 'bg-#fff4e5 text-#ff9f1a',
        title: '会议名称超过十二个字就为...',
        time: '下午14:00-15:00',
        creator: '张浩',
        participants: '张浩 张浩 张浩 张浩 张浩 ...等共20人',
      },
      {
        id: 2,
        status: '待进入',
        statusClass: 'bg-#e7edff text-#3f5fff',
        title: '会议名称超过十二个字就为...',
        time: '下午14:00-15:00',
        creator: '张浩',
        participants: '张浩 张浩 张浩 张浩 张浩 ...等共20人',
      },
      {
        id: 3,
        title: '会议名称超过十二个字就为...',
        time: '下午14:00-15:00',
        tip: '30分钟后开始',
        creator: '张浩',
        participants: '张浩 张浩 张浩 张浩 张浩 ...等共20人',
      },
      {
        id: 4,
        title: '会议名称超过十二个字就为...',
        time: '下午14:00-15:00',
        creator: '张浩',
        participants: '张浩 张浩 张浩 张浩 张浩 ...等共20人',
      },
    ],
  },
  {
    date: '明天 1月9日',
    items: [
      {
        id: 5,
        title: '会议名称超过十二个字就为...',
        time: '下午14:00-15:00',
        creator: '张浩',
        participants: '张浩 张浩 张浩 张浩 张浩 ...等共20人',
      },
    ],
  },
])

async function loadMeetingList() {
  try {
    const response = await getMeetingList()
    const list = response?.data?.data?.records || response?.data?.data || []
    if (Array.isArray(list) && list.length > 0) {
      meetingSections.value = list
    }
  }
  catch (error) {
    console.error('fetch meeting list failed', error)
  }
}

onLoad(() => {
  loadMeetingList()
})

function goToCreate() {
  uni.navigateTo({ url: '/pages/meeting/create' })
}

function goToHistory() {
  uni.navigateTo({ url: '/pages/meeting/history' })
}

function goToDetail(meetingId: number) {
  uni.navigateTo({ url: `/pages/meeting/detail?meetingId=${meetingId}` })
}
</script>

<template>
  <view class="min-h-screen bg-#f6f7f9">
    <view class="bg-white px-4 pb-2 pt-3">
      <view class="flex gap-4">
        <view
          class="flex flex-1 flex-col items-center gap-2 rounded-3 bg-#f5f7ff py-3"
          @click="goToCreate"
        >
          <view
            class="h-9 w-9 flex items-center justify-center rounded-3 bg-#e7edff text-#3f5fff"
          >
            <wd-icon name="video" size="18px" />
          </view>
          <text class="text-3 text-#3f5fff">
            预约会议
          </text>
        </view>
        <view
          class="flex flex-1 flex-col items-center gap-2 rounded-3 bg-#f5f7ff py-3"
          @click="goToHistory"
        >
          <view
            class="h-9 w-9 flex items-center justify-center rounded-3 bg-#e7edff text-#3f5fff"
          >
            <wd-icon name="time" size="18px" />
          </view>
          <text class="text-3 text-#3f5fff">
            历史会议
          </text>
        </view>
      </view>
    </view>

    <view class="px-4 pb-4">
      <text class="mb-3 mt-4 block text-4 text-#2f2f2f font-600">
        预约会议列表
      </text>
      <view v-for="section in meetingSections" :key="section.date" class="mb-4">
        <text class="mb-2 block text-3 text-#9aa0a6">
          {{ section.date }}
        </text>
        <view
          v-for="item in section.items"
          :key="item.id"
          class="mb-3 rounded-3 bg-white p-3 shadow-[0_4px_12px_rgba(31,35,41,0.04)]"
          @click="goToDetail(item.id)"
        >
          <view class="flex items-center gap-2">
            <view
              v-if="item.status"
              class="rounded-full px-2 py-0.5 text-2.5 leading-4"
              :class="item.statusClass"
            >
              {{ item.status }}
            </view>
            <text class="flex-1 text-3.5 text-#2f2f2f font-600">
              {{ item.title }}
            </text>
            <wd-icon name="more" size="16px" color="#c2c6cc" />
          </view>
          <text class="mt-1.5 block text-3 text-#5c6066">
            {{ item.time }}
          </text>
          <text v-if="item.tip" class="mt-1 block text-2.5 text-#ff7a00">
            {{ item.tip }}
          </text>
          <view class="mt-2 text-2.5 text-#9aa0a6 space-y-1">
            <text class="block">
              创建者：{{ item.creator }}
            </text>
            <text class="block">
              参会人：{{ item.participants }}
            </text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

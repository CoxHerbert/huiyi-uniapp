<script setup lang="ts">
interface MeetingInfo {
  name: string
  type: string
  startTime: string
  endTime: string
  date: string
  duration: string
  participants: string
  room: string
  location: string
  password: string
  attachment: string
  description: string
}

const props = defineProps<{ title: string; submitText: string; meeting: MeetingInfo }>()
const emit = defineEmits<{ (event: 'submit'): void }>()

const displayText = (value: string, placeholder: string) => value || placeholder
const isPlaceholder = (value: string) => !value
</script>

<template>
  <view class="min-h-screen bg-#f5f6f8 pb-6">
    <view class="mx-4 mt-4 rounded-4 bg-white">
      <view class="flex items-center justify-between border-b border-#f0f1f2 px-4 py-4">
        <text class="text-3.5 text-#2f2f2f">{{ meeting.name }}</text>
        <wd-icon name="close" size="16px" color="#c4c7cc" />
      </view>

      <view class="flex items-center justify-between border-b border-#f0f1f2 px-4 py-4">
        <text class="text-3 text-#8a8f99">会议类型</text>
        <view class="flex items-center gap-2">
          <text class="text-3 text-#2f2f2f">{{ meeting.type }}</text>
          <wd-icon name="arrow-right" size="14px" color="#c4c7cc" />
        </view>
      </view>

      <slot name="time">
        <view class="border-b border-#f0f1f2 px-4 py-4">
          <view class="flex items-center justify-between">
            <view class="flex items-center gap-6">
              <view class="text-center">
                <text class="block text-5 font-600 text-#2f2f2f">{{ meeting.startTime }}</text>
                <text class="text-2.5 text-#9aa0a6">{{ meeting.date }}</text>
              </view>
              <view class="text-center">
                <text class="block text-2.5 text-#9aa0a6">{{ meeting.duration }}</text>
              </view>
              <view class="text-center">
                <text class="block text-5 font-600 text-#2f2f2f">{{ meeting.endTime }}</text>
                <text class="text-2.5 text-#9aa0a6">{{ meeting.date }}</text>
              </view>
            </view>
          </view>
        </view>
      </slot>

      <view class="flex items-center justify-between border-b border-#f0f1f2 px-4 py-4">
        <text class="text-3 text-#8a8f99">参会人</text>
        <view class="flex items-center gap-2">
          <view class="h-6 w-6 rounded-full bg-#d9dce1" />
          <text class="text-3 text-#2f2f2f">{{ meeting.participants }}</text>
          <wd-icon name="arrow-right" size="14px" color="#c4c7cc" />
        </view>
      </view>

      <view class="flex items-center justify-between border-b border-#f0f1f2 px-4 py-4">
        <text class="text-3 text-#8a8f99">会议室</text>
        <text
          class="text-3"
          :class="isPlaceholder(meeting.room) ? 'text-#c4c7cc' : 'text-#2f2f2f'"
        >
          {{ displayText(meeting.room, '选择会议室') }}
        </text>
      </view>

      <view class="flex items-center justify-between border-b border-#f0f1f2 px-4 py-4">
        <text class="text-3 text-#8a8f99">地点</text>
        <text
          class="text-3"
          :class="isPlaceholder(meeting.location) ? 'text-#c4c7cc' : 'text-#2f2f2f'"
        >
          {{ displayText(meeting.location, '添加地点') }}
        </text>
      </view>

      <view class="flex items-center justify-between border-b border-#f0f1f2 px-4 py-4">
        <text class="text-3 text-#8a8f99">会议密码</text>
        <text
          class="text-3"
          :class="isPlaceholder(meeting.password) ? 'text-#c4c7cc' : 'text-#2f2f2f'"
        >
          {{ displayText(meeting.password, '请设置会议密码') }}
        </text>
      </view>

      <view class="flex items-center justify-between border-b border-#f0f1f2 px-4 py-4">
        <text class="text-3 text-#8a8f99">添加会议附件</text>
        <wd-icon name="arrow-right" size="14px" color="#c4c7cc" />
      </view>

      <view class="px-4 py-4">
        <text
          class="text-3"
          :class="isPlaceholder(meeting.description) ? 'text-#c4c7cc' : 'text-#2f2f2f'"
        >
          {{ displayText(meeting.description, '请输入会议描述...') }}
        </text>
      </view>
    </view>

    <view class="mx-4 mt-6">
      <wd-button type="primary" block @click="emit('submit')">{{ submitText }}</wd-button>
    </view>
  </view>
</template>

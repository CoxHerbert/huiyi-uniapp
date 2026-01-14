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
  agentid: string
  calId: string
  hosts: string
  ringUsers: string
  remindScope: string
  remindBefore: string
  isRepeat: boolean
  repeatType: string
  repeatUntil: string
  repeatInterval: string
  enableWaitingRoom: boolean
  allowEnterBeforeHost: boolean
  enableEnterMute: boolean
  enableScreenWatermark: boolean
}

const props = defineProps<{ title: string, submitText: string, meeting: MeetingInfo }>()
const emit = defineEmits<{
  (event: 'submit'): void
  (event: 'update:meeting', value: MeetingInfo): void
}>()

const showTypeSheet = ref(false)
const meetingTypeOptions = [
  { label: '线上会议', value: '线上会议' },
  { label: '线下会议', value: '线下会议' },
]

const updateField = <K extends keyof MeetingInfo>(key: K, value: MeetingInfo[K]) => {
  emit('update:meeting', { ...props.meeting, [key]: value })
}

const openTypeSheet = () => {
  showTypeSheet.value = true
}

const handleTypeSelect = (option: { label: string, value: string }) => {
  updateField('type', option.value)
  showTypeSheet.value = false
}
</script>

<template>
  <view class="min-h-screen bg-#f5f6f8 pb-6">
    <view class="mx-4 mt-4 rounded-4 bg-white">
      <slot name="title">
        <view class="flex items-center justify-between border-b border-#f0f1f2 px-4 py-2">
          <wd-input
            :model-value="meeting.name"
            placeholder="请输入会议名称"
            clearable
            custom-class="flex-1"
            @update:model-value="(value) => updateField('name', value)"
          />
          <wd-icon name="close" size="16px" color="#c4c7cc" />
        </view>
      </slot>

      <view
        class="flex items-center justify-between border-b border-#f0f1f2 px-4 py-4"
        @click="openTypeSheet"
      >
        <text class="text-3 text-#8a8f99">
          会议类型
        </text>
        <view class="flex items-center gap-2">
          <text class="text-3 text-#2f2f2f">
            {{ meeting.type }}
          </text>
          <wd-icon name="arrow-right" size="14px" color="#c4c7cc" />
        </view>
      </view>

      <slot name="time">
        <view class="border-b border-#f0f1f2 px-4 py-4">
          <view class="flex items-center justify-between">
            <view class="flex items-center gap-6">
              <view class="text-center">
                <text class="block text-5 text-#2f2f2f font-600">
                  {{ meeting.startTime }}
                </text>
                <text class="text-2.5 text-#9aa0a6">
                  {{ meeting.date }}
                </text>
              </view>
              <view class="text-center">
                <text class="block text-2.5 text-#9aa0a6">
                  {{ meeting.duration }}
                </text>
              </view>
              <view class="text-center">
                <text class="block text-5 text-#2f2f2f font-600">
                  {{ meeting.endTime }}
                </text>
                <text class="text-2.5 text-#9aa0a6">
                  {{ meeting.date }}
                </text>
              </view>
            </view>
          </view>
        </view>
      </slot>

      <view class="flex items-center justify-between border-b border-#f0f1f2 px-4 py-2">
        <text class="text-3 text-#8a8f99">
          参会人
        </text>
        <wd-input
          :model-value="meeting.participants"
          placeholder="请输入参会人，逗号分隔"
          custom-class="flex-1 text-right"
          @update:model-value="(value) => updateField('participants', value)"
        />
      </view>

      <view class="flex items-center justify-between border-b border-#f0f1f2 px-4 py-4">
        <text class="text-3 text-#8a8f99">
          会议室
        </text>
        <wd-input
          :model-value="meeting.room"
          placeholder="选择会议室"
          custom-class="flex-1 text-right"
          @update:model-value="(value) => updateField('room', value)"
        />
      </view>

      <view class="flex items-center justify-between border-b border-#f0f1f2 px-4 py-4">
        <text class="text-3 text-#8a8f99">
          地点
        </text>
        <wd-input
          :model-value="meeting.location"
          placeholder="添加地点"
          custom-class="flex-1 text-right"
          @update:model-value="(value) => updateField('location', value)"
        />
      </view>

      <view class="flex items-center justify-between border-b border-#f0f1f2 px-4 py-4">
        <text class="text-3 text-#8a8f99">
          会议密码
        </text>
        <wd-input
          :model-value="meeting.password"
          placeholder="请设置会议密码"
          custom-class="flex-1 text-right"
          @update:model-value="(value) => updateField('password', value)"
        />
      </view>

      <view class="flex items-center justify-between border-b border-#f0f1f2 px-4 py-4">
        <text class="text-3 text-#8a8f99">
          添加会议附件
        </text>
        <wd-icon name="arrow-right" size="14px" color="#c4c7cc" />
      </view>

      <view class="px-4 py-3">
        <wd-input
          :model-value="meeting.description"
          placeholder="请输入会议描述..."
          type="textarea"
          auto-height
          @update:model-value="(value) => updateField('description', value)"
        />
      </view>

      <view class="border-t border-#f0f1f2 px-4 py-3">
        <text class="text-3 text-#8a8f99">会议设置</text>
      </view>

      <view class="flex items-center justify-between border-b border-#f0f1f2 px-4 py-4">
        <text class="text-3 text-#8a8f99">
          应用ID
        </text>
        <wd-input
          :model-value="meeting.agentid"
          placeholder="请输入应用ID"
          type="number"
          custom-class="flex-1 text-right"
          @update:model-value="(value) => updateField('agentid', value)"
        />
      </view>

      <view class="flex items-center justify-between border-b border-#f0f1f2 px-4 py-4">
        <text class="text-3 text-#8a8f99">
          日程ID
        </text>
        <wd-input
          :model-value="meeting.calId"
          placeholder="请输入日程ID"
          custom-class="flex-1 text-right"
          @update:model-value="(value) => updateField('calId', value)"
        />
      </view>

      <view class="flex items-center justify-between border-b border-#f0f1f2 px-4 py-4">
        <text class="text-3 text-#8a8f99">
          主持人
        </text>
        <wd-input
          :model-value="meeting.hosts"
          placeholder="请输入主持人，逗号分隔"
          custom-class="flex-1 text-right"
          @update:model-value="(value) => updateField('hosts', value)"
        />
      </view>

      <view class="flex items-center justify-between border-b border-#f0f1f2 px-4 py-4">
        <text class="text-3 text-#8a8f99">
          呼叫成员
        </text>
        <wd-input
          :model-value="meeting.ringUsers"
          placeholder="请输入呼叫成员，逗号分隔"
          custom-class="flex-1 text-right"
          @update:model-value="(value) => updateField('ringUsers', value)"
        />
      </view>

      <view class="flex items-center justify-between border-b border-#f0f1f2 px-4 py-4">
        <text class="text-3 text-#8a8f99">
          启用等候室
        </text>
        <wd-switch
          :model-value="meeting.enableWaitingRoom"
          size="18px"
          @update:model-value="(value) => updateField('enableWaitingRoom', value)"
        />
      </view>

      <view class="flex items-center justify-between border-b border-#f0f1f2 px-4 py-4">
        <text class="text-3 text-#8a8f99">
          主持人前进入
        </text>
        <wd-switch
          :model-value="meeting.allowEnterBeforeHost"
          size="18px"
          @update:model-value="(value) => updateField('allowEnterBeforeHost', value)"
        />
      </view>

      <view class="flex items-center justify-between border-b border-#f0f1f2 px-4 py-4">
        <text class="text-3 text-#8a8f99">
          入会自动静音
        </text>
        <wd-switch
          :model-value="meeting.enableEnterMute"
          size="18px"
          @update:model-value="(value) => updateField('enableEnterMute', value)"
        />
      </view>

      <view class="flex items-center justify-between border-b border-#f0f1f2 px-4 py-4">
        <text class="text-3 text-#8a8f99">
          屏幕水印
        </text>
        <wd-switch
          :model-value="meeting.enableScreenWatermark"
          size="18px"
          @update:model-value="(value) => updateField('enableScreenWatermark', value)"
        />
      </view>

      <view class="border-t border-#f0f1f2 px-4 py-3">
        <text class="text-3 text-#8a8f99">提醒设置</text>
      </view>

      <view class="flex items-center justify-between border-b border-#f0f1f2 px-4 py-4">
        <text class="text-3 text-#8a8f99">
          提醒范围
        </text>
        <wd-input
          :model-value="meeting.remindScope"
          placeholder="请输入提醒范围"
          type="number"
          custom-class="flex-1 text-right"
          @update:model-value="(value) => updateField('remindScope', value)"
        />
      </view>

      <view class="flex items-center justify-between border-b border-#f0f1f2 px-4 py-4">
        <text class="text-3 text-#8a8f99">
          提醒时间
        </text>
        <wd-input
          :model-value="meeting.remindBefore"
          placeholder="请输入提醒秒数，逗号分隔"
          custom-class="flex-1 text-right"
          @update:model-value="(value) => updateField('remindBefore', value)"
        />
      </view>

      <view class="flex items-center justify-between border-b border-#f0f1f2 px-4 py-4">
        <text class="text-3 text-#8a8f99">
          重复提醒
        </text>
        <wd-switch
          :model-value="meeting.isRepeat"
          size="18px"
          @update:model-value="(value) => updateField('isRepeat', value)"
        />
      </view>

      <view class="flex items-center justify-between border-b border-#f0f1f2 px-4 py-4">
        <text class="text-3 text-#8a8f99">
          重复类型
        </text>
        <wd-input
          :model-value="meeting.repeatType"
          placeholder="请输入重复类型"
          type="number"
          custom-class="flex-1 text-right"
          @update:model-value="(value) => updateField('repeatType', value)"
        />
      </view>

      <view class="flex items-center justify-between border-b border-#f0f1f2 px-4 py-4">
        <text class="text-3 text-#8a8f99">
          重复结束时间
        </text>
        <wd-input
          :model-value="meeting.repeatUntil"
          placeholder="请输入结束时间戳"
          type="number"
          custom-class="flex-1 text-right"
          @update:model-value="(value) => updateField('repeatUntil', value)"
        />
      </view>

      <view class="flex items-center justify-between px-4 py-4">
        <text class="text-3 text-#8a8f99">
          重复间隔
        </text>
        <wd-input
          :model-value="meeting.repeatInterval"
          placeholder="请输入重复间隔"
          type="number"
          custom-class="flex-1 text-right"
          @update:model-value="(value) => updateField('repeatInterval', value)"
        />
      </view>
    </view>

    <view class="mx-4 mt-6">
      <wd-button type="primary" block @click="emit('submit')">
        {{ submitText }}
      </wd-button>
    </view>

    <wd-action-sheet v-model="showTypeSheet" title="会议类型" :close-on-click-action="true">
      <view class="px-4 pb-4">
        <view
          v-for="option in meetingTypeOptions"
          :key="option.value"
          class="flex items-center justify-between border-b border-#f0f1f2 py-3 last:border-b-0"
          @click="handleTypeSelect(option)"
        >
          <text class="text-3 text-#2f2f2f">{{ option.label }}</text>
          <wd-icon
            v-if="meeting.type === option.value"
            name="check"
            size="18px"
            color="#4f7bff"
          />
        </view>
      </view>
      <wd-gap :height="50" />
    </wd-action-sheet>
  </view>
</template>

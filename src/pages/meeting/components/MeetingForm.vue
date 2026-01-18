<script setup lang="ts">
import type { UserOption } from './UserPickerSheet.vue'
import { computed, reactive, ref } from 'vue'
import { useUserStore } from '@/store/user'
import UserPickerSheet from './UserPickerSheet.vue'

interface MeetingInfo {
  name: string
  type: string
  hosts: string[]
  participantNames?: string[]
  users?: Array<{ realName: string, account: string }>
  hostUser?: Array<{ realName: string, account: string }>
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

const props = defineProps<{ title: string, submitText: string, meeting: MeetingInfo }>()
const emit = defineEmits<{
  (event: 'submit'): void
  (event: 'update:meeting', value: MeetingInfo): void
}>()

const userStore = useUserStore()
const loginInfo = computed(() => userStore.loginInfo)

const showTypeSheet = ref(false)
const showHostSheet = ref(false)
const showParticipantSheet = ref(false)

const meetingTypeOptions = [
  { label: '线上会议', value: '线上会议' },
  { label: '线下会议', value: '线下会议' },
]

/** 仅用于给选择器传默认值（打开时同步 meeting 数据） */
const selectedParticipantIds = ref<string[]>([])
const selectedHostIds = ref<string[]>([])

function updateField<K extends keyof MeetingInfo>(key: K, value: MeetingInfo[K]) {
  emit('update:meeting', { ...props.meeting, [key]: value })
}

function openTypeSheet() {
  showTypeSheet.value = true
}

function handleTypeSelect(option: { label: string, value: string }) {
  updateField('type', option.value)
  showTypeSheet.value = false
}

function parseUserIds(value: string) {
  return (value || '')
    .split(/[、,，]/)
    .map(item => item.trim())
    .filter(Boolean)
}

function openHostSheet() {
  const hostIds = (props.meeting.hostUser || [])
    .map(user => user.account)
    .filter(Boolean)
  selectedHostIds.value = (hostIds.length ? hostIds : props.meeting.hosts || []).slice(0, 10)
  showHostSheet.value = true
}

function openParticipantSheet() {
  const userIds = (props.meeting.users || [])
    .map(user => user.account)
    .filter(Boolean)
  selectedParticipantIds.value = userIds.length ? userIds : parseUserIds(props.meeting.participants)
  showParticipantSheet.value = true
}

/** 选择器确认：主持人 */
function onHostConfirm(payload: { selectedIds: string[], selectedUsers: UserOption[] }) {
  const ids = (payload.selectedIds || []).slice(0, 10)
  selectedHostIds.value = ids

  updateField('hosts', ids)
  updateField(
    'hostUser',
    (payload.selectedUsers || []).slice(0, 10).map(u => ({ realName: u.name, account: u.account })),
  )
}

/** 选择器确认：参会人 */
function onParticipantConfirm(payload: { selectedIds: string[], selectedUsers: UserOption[] }) {
  const ids = payload.selectedIds || []
  selectedParticipantIds.value = ids

  updateField('participants', ids.join(','))
  updateField('participantNames', (payload.selectedUsers || []).map(u => u.name))
  updateField(
    'users',
    (payload.selectedUsers || []).map(u => ({ realName: u.name, account: u.account })),
  )
}

/** 展示：如果当前账号是登录人且有 real_name，优先展示登录人姓名 */
function getNameByAccount(account: string) {
  if (account && account === loginInfo.value?.account && loginInfo.value?.real_name)
    return loginInfo.value.real_name
  return account
}

const hostDisplayText = computed(() => {
  // 优先使用 hostUser（更稳定，不依赖反查）
  if (props.meeting.hostUser?.length)
    return props.meeting.hostUser.map(u => u.realName || u.account).filter(Boolean).join('、')

  const names = (props.meeting.hosts || []).map(account => getNameByAccount(account))
  return names.filter(Boolean).join('、')
})

const participantDisplayText = computed(() => {
  if (props.meeting.users?.length) {
    return props.meeting.users
      .map(user => user.realName || user.account)
      .filter(Boolean)
      .join('、')
  }

  // 退化：显示账号（不依赖子组件 userOptions）
  const accounts = parseUserIds(props.meeting.participants)
  return accounts.map(a => getNameByAccount(a)).filter(Boolean).join('、')
})
</script>

<template>
  <view class="meeting-page min-h-screen bg-#f5f6f8 pb-8">
    <view class="">
      <slot name="title">
        <view class="mb-2 flex items-center justify-between bg-white px-3">
          <text class="text-4 text-#8a8f99">
            会议标题
          </text>
          <wd-input
            :model-value="meeting.name"
            placeholder="请输入会议名称"
            custom-class="meeting-form-input flex-1 w-full"
            align-right
            :no-border="true"
            clearable
            size="large"
            @update:model-value="(value) => updateField('name', value)"
          />
        </view>
      </slot>

      <!-- 会议类型（如需启用，取消注释即可） -->
      <!--
      <view class="mb-2 flex items-center justify-between bg-white px-4 py-3" @click="openTypeSheet">
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
      -->

      <slot name="time">
        <view class="mb-2 bg-white px-4 py-3">
          <view class="flex items-center justify-between">
            <view class="flex items-center gap-6">
              <view class="text-center">
                <text class="block text-5 text-#2f2f2f font-600">
                  {{ meeting.startTime }}
                </text>
                <text class="text-3 text-#9aa0a6">
                  {{ meeting.date }}
                </text>
              </view>
              <view class="text-center">
                <text class="block text-3 text-#9aa0a6">
                  {{ meeting.duration }}
                </text>
              </view>
              <view class="text-center">
                <text class="block text-5 text-#2f2f2f font-600">
                  {{ meeting.endTime }}
                </text>
                <text class="text-3 text-#9aa0a6">
                  {{ meeting.date }}
                </text>
              </view>
            </view>
          </view>
        </view>
      </slot>

      <view class="mb-2 flex items-center justify-between bg-white px-3" @click="openHostSheet">
        <text class="text-4 text-#8a8f99">
          主持人
        </text>
        <view class="flex flex-1 items-center justify-end gap-2">
          <wd-input
            :model-value="hostDisplayText"
            placeholder="请选择主持人"
            custom-class="meeting-form-input flex-1 w-full"
            align-right
            :no-border="true"
            readonly
            size="large"
          />
          <wd-icon name="arrow-right" size="14px" color="#c4c7cc" />
        </view>
      </view>

      <view class="mb-2 flex items-center justify-between bg-white px-3">
        <text class="text-4 text-#8a8f99">
          参会人
        </text>
        <view class="flex flex-1 items-center justify-end gap-2" @click="openParticipantSheet">
          <wd-input
            :model-value="participantDisplayText"
            placeholder="请选择参会人"
            custom-class="meeting-form-input flex-1 w-full"
            align-right
            :no-border="true"
            readonly
            size="large"
          />
          <wd-icon name="arrow-right" size="14px" color="#c4c7cc" />
        </view>
      </view>

      <!-- 会议地点 -->
      <view class="mb-2 flex items-center justify-between bg-white px-3">
        <text class="text-4 text-#8a8f99">
          会议地点
        </text>
        <wd-input
          :model-value="meeting.location"
          placeholder="添加会议地点"
          custom-class="meeting-form-input flex-1 w-full"
          align-right
          :no-border="true"
          size="large"
          @update:model-value="(value) => updateField('location', value)"
        />
      </view>

      <!-- 描述 -->
      <view class="bg-white px-3">
        <wd-input
          :model-value="meeting.description"
          placeholder="请输入会议描述..."
          type="textarea"
          auto-height
          custom-class="meeting-form-input w-full"
          :no-border="true"
          size="large"
          @update:model-value="(value) => updateField('description', value)"
        />
      </view>
    </view>

    <view
      class="fixed bottom-0 left-0 right-0 z-10 border-t border-#f0f1f2 bg-white px-4 py-3 pb-[calc(12px+env(safe-area-inset-bottom))]"
    >
      <wd-button type="primary" block @click="emit('submit')">
        {{ submitText }}
      </wd-button>
    </view>

    <!-- 会议类型 ActionSheet（如启用类型选择，取消注释上面的入口即可） -->
    <wd-action-sheet v-model="showTypeSheet" title="会议类型" :close-on-click-action="true">
      <view class="px-4 pb-4">
        <view
          v-for="option in meetingTypeOptions"
          :key="option.value"
          class="flex items-center justify-between border-b border-#f0f1f2 py-3 last:border-b-0"
          @click="handleTypeSelect(option)"
        >
          <text class="text-3 text-#2f2f2f">
            {{ option.label }}
          </text>
          <wd-icon v-if="meeting.type === option.value" name="check" size="18px" color="#4f7bff" />
        </view>
      </view>
      <wd-gap :height="50" />
    </wd-action-sheet>

    <!-- ✅ 主持人选择器（最多10人） -->
    <UserPickerSheet
      v-model="showHostSheet"
      title="选择主持人"
      mode="multiple"
      :max-selected="10"
      :default-selected="selectedHostIds"
      :default-selected-users="(meeting.hostUser || []).map(user => ({ account: user.account, name: user.realName || user.account }))"
      @confirm="onHostConfirm"
    />

    <!-- ✅ 参会人选择器（多选） -->
    <UserPickerSheet
      v-model="showParticipantSheet"
      title="选择参会人"
      mode="multiple"
      :default-selected="selectedParticipantIds"
      :default-selected-users="(meeting.users || []).map(user => ({ account: user.account, name: user.realName || user.account }))"
      @confirm="onParticipantConfirm"
    />
  </view>
</template>

<style scoped>
.meeting-page {
  font-size: 30rpx;
}
</style>

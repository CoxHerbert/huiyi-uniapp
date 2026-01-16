<script setup lang="ts">
import { getUserList } from '@/api/user'
interface MeetingInfo {
  name: string
  type: string
  adminUserid: string
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

const showTypeSheet = ref(false)
const showAdminSheet = ref(false)
const showParticipantSheet = ref(false)
const meetingTypeOptions = [
  { label: '线上会议', value: '线上会议' },
  { label: '线下会议', value: '线下会议' },
]
const userKeyword = ref('')
const userLoading = ref(false)
const userOptions = ref<Array<{ account: string, name: string }>>([])
const selectedParticipantIds = ref<string[]>([])
let searchTimer: ReturnType<typeof setTimeout> | null = null

function updateField<K extends keyof MeetingInfo>(key: K, value: MeetingInfo[K]) {
  emit('update:meeting', { ...props.meeting, [key]: value })
}

function openTypeSheet() {
  showTypeSheet.value = true
}

function openAdminSheet() {
  showAdminSheet.value = true
  loadUsers()
}

function handleTypeSelect(option: { label: string, value: string }) {
  updateField('type', option.value)
  showTypeSheet.value = false
}

function resolveUserAccount(record: any) {
  return String(
    record?.account
    ?? record?.userCode
    ?? record?.jobNumber
    ?? record?.workNo
    ?? record?.workCode
    ?? record?.userid
    ?? record?.userId
    ?? record?.id
    ?? '',
  ).trim()
}

function resolveUserName(record: any) {
  return String(
    record?.name
    ?? record?.realName
    ?? record?.username
    ?? record?.userName
    ?? '',
  ).trim()
}

async function loadUsers() {
  try {
    userLoading.value = true
    const keyword = userKeyword.value.trim()
    const params = keyword
      ? { name: keyword, account: keyword }
      : {}
    const response = await getUserList(params)
    const records = response?.data?.data?.records || response?.data?.data || []
    userOptions.value = Array.isArray(records)
      ? records
          .map((item: any) => ({
            account: resolveUserAccount(item),
            name: resolveUserName(item),
          }))
          .filter(item => item.account || item.name)
      : []
  }
  catch (error) {
    console.error('fetch user list failed', error)
    userOptions.value = []
  }
  finally {
    userLoading.value = false
  }
}

function handleAdminSelect(option: { account: string, name: string }) {
  updateField('adminUserid', option.account)
  showAdminSheet.value = false
}

function openParticipantSheet() {
  selectedParticipantIds.value = parseUserIds(props.meeting.participants)
  showParticipantSheet.value = true
  loadUsers()
}

function toggleParticipant(account: string) {
  if (!account)
    return
  if (selectedParticipantIds.value.includes(account)) {
    selectedParticipantIds.value = selectedParticipantIds.value.filter(id => id !== account)
  }
  else {
    selectedParticipantIds.value = [...selectedParticipantIds.value, account]
  }
}

function applyParticipantSelection() {
  updateField('participants', selectedParticipantIds.value.join(','))
  showParticipantSheet.value = false
}

function parseUserIds(value: string) {
  return value
    .split(/[、,，]/)
    .map(item => item.trim())
    .filter(Boolean)
}

function resetUserSearch() {
  userKeyword.value = ''
  loadUsers()
}

watch(userKeyword, () => {
  if (searchTimer)
    clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    loadUsers()
  }, 300)
})
</script>

<template>
  <view class="min-h-screen bg-#f5f6f8 pb-8">
    <view class="">
      <slot name="title">
        <view class="mb-2 flex items-center justify-between bg-white px-4 py-3">
          <wd-input
            :model-value="meeting.name"
            placeholder="请输入会议名称"
            custom-class="meeting-form-input flex-1 w-full"
            align-right
            @update:model-value="(value) => updateField('name', value)"
          />
          <wd-icon name="close" size="16px" color="#c4c7cc" @click="meeting.name = ''" />
        </view>
      </slot>

      <view
        class="mb-2 flex items-center justify-between bg-white px-4 py-3"
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
        <view class="mb-2 bg-white px-4 py-3">
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

      <view
        class="flex items-center justify-between bg-white px-4 py-3"
        @click="openAdminSheet"
      >
        <view class="flex items-center gap-1">
          <text class="text-3 text-#ff4d4f">
            *
          </text>
          <text class="text-3 text-#8a8f99">
            管理员
          </text>
        </view>
        <view class="flex items-center gap-2">
          <text
            class="text-3"
            :class="meeting.adminUserid ? 'text-#2f2f2f' : 'text-#c2c6cc'"
          >
            {{ meeting.adminUserid || '请选择管理员' }}
          </text>
          <wd-icon name="arrow-right" size="14px" color="#c4c7cc" />
        </view>
      </view>

      <view class="mb-2 flex items-center justify-between bg-white px-4 pb-3">
        <text class="text-3 text-#8a8f99">
          参会人
        </text>
        <view class="flex flex-1 items-center justify-end gap-2">
          <wd-input
            :model-value="meeting.participants"
            placeholder="请选择参会人"
            custom-class="meeting-form-input flex-1 w-full"
            align-right
            @update:model-value="(value) => updateField('participants', value)"
          />
          <wd-icon name="search" size="16px" color="#c4c7cc" @click="openParticipantSheet" />
        </view>
      </view>

      <view class="flex items-center justify-between bg-white px-4 py-3">
        <text class="text-3 text-#8a8f99">
          会议室
        </text>
        <wd-input
          :model-value="meeting.room"
          placeholder="选择会议室"
          custom-class="meeting-form-input flex-1 w-full"
          align-right
          @update:model-value="(value) => updateField('room', value)"
        />
      </view>

      <view class="flex items-center justify-between bg-white px-4">
        <text class="text-3 text-#8a8f99">
          地点
        </text>
        <wd-input
          :model-value="meeting.location"
          placeholder="添加地点"
          custom-class="meeting-form-input flex-1 w-full"
          align-right
          @update:model-value="(value) => updateField('location', value)"
        />
      </view>

      <view class="mb-2 flex items-center justify-between bg-white px-4 py-3">
        <text class="text-3 text-#8a8f99">
          会议密码
        </text>
        <wd-input
          :model-value="meeting.password"
          placeholder="请设置会议密码"
          custom-class="meeting-form-input flex-1 w-full"
          align-right
          @update:model-value="(value) => updateField('password', value)"
        />
      </view>

      <view class="mb-2 flex items-center justify-between bg-white px-4 py-3">
        <text class="text-3 text-#8a8f99">
          添加会议附件
        </text>
        <wd-icon name="arrow-right" size="14px" color="#c4c7cc" />
      </view>

      <view class="bg-white px-4 py-3">
        <wd-input
          :model-value="meeting.description"
          placeholder="请输入会议描述..."
          type="textarea"
          auto-height
          custom-class="meeting-form-input w-full"
          align-right
          @update:model-value="(value) => updateField('description', value)"
        />
      </view>
    </view>

    <view class="fixed bottom-0 left-0 right-0 z-10 border-t border-#f0f1f2 bg-white px-4 py-3 pb-[calc(12px+env(safe-area-inset-bottom))]">
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
          <text class="text-3 text-#2f2f2f">
            {{ option.label }}
          </text>
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

    <wd-action-sheet v-model="showAdminSheet" title="选择管理员" :close-on-click-action="true">
      <view class="px-4 pb-4">
        <view class="mb-3 flex items-center gap-2 rounded-2 bg-#f3f4f6 px-3 py-2">
          <wd-icon name="search" size="16px" color="#9aa0a6" />
          <wd-input
            v-model="userKeyword"
            placeholder="请输入工号或姓名"
            custom-class="meeting-form-input w-full"
            align-right
          />
          <wd-icon name="close" size="14px" color="#c4c7cc" @click="resetUserSearch" />
        </view>
        <view v-if="userLoading" class="py-4 text-center text-2.5 text-#9aa0a6">
          正在加载...
        </view>
        <view v-else-if="userOptions.length === 0" class="py-4 text-center text-2.5 text-#9aa0a6">
          暂无人员数据
        </view>
        <view
          v-for="option in userOptions"
          :key="option.account"
          class="flex items-center justify-between border-b border-#f0f1f2 py-3 last:border-b-0"
          @click="handleAdminSelect(option)"
        >
          <view class="flex flex-col">
            <text class="text-3 text-#2f2f2f">
              {{ option.name || option.account }}
            </text>
            <text v-if="option.name && option.account" class="text-2.5 text-#9aa0a6">
              {{ option.account }}
            </text>
          </view>
          <wd-icon
            v-if="meeting.adminUserid === option.account"
            name="check"
            size="18px"
            color="#4f7bff"
          />
        </view>
      </view>
      <wd-gap :height="50" />
    </wd-action-sheet>

    <wd-action-sheet v-model="showParticipantSheet" title="选择参会人" :close-on-click-action="true">
      <view class="px-4 pb-4">
        <view class="mb-3 flex items-center gap-2 rounded-2 bg-#f3f4f6 px-3 py-2">
          <wd-icon name="search" size="16px" color="#9aa0a6" />
          <wd-input
            v-model="userKeyword"
            placeholder="请输入工号或姓名"
            custom-class="meeting-form-input w-full"
            align-right
          />
          <wd-icon name="close" size="14px" color="#c4c7cc" @click="resetUserSearch" />
        </view>
        <view v-if="userLoading" class="py-4 text-center text-2.5 text-#9aa0a6">
          正在加载...
        </view>
        <view v-else-if="userOptions.length === 0" class="py-4 text-center text-2.5 text-#9aa0a6">
          暂无人员数据
        </view>
        <view
          v-for="option in userOptions"
          :key="option.account"
          class="flex items-center justify-between border-b border-#f0f1f2 py-3 last:border-b-0"
          @click="toggleParticipant(option.account)"
        >
          <view class="flex flex-col">
            <text class="text-3 text-#2f2f2f">
              {{ option.name || option.account }}
            </text>
            <text v-if="option.name && option.account" class="text-2.5 text-#9aa0a6">
              {{ option.account }}
            </text>
          </view>
          <wd-icon
            v-if="selectedParticipantIds.includes(option.account)"
            name="check"
            size="18px"
            color="#4f7bff"
          />
        </view>
        <view class="mt-4 flex gap-3">
          <wd-button block type="info" @click="showParticipantSheet = false">
            取消
          </wd-button>
          <wd-button block type="primary" @click="applyParticipantSelection">
            确认
          </wd-button>
        </view>
      </view>
      <wd-gap :height="50" />
    </wd-action-sheet>
  </view>
</template>

<style scoped>
:deep(.meeting-form-input.wd-input::after) {
  display: none;
}
</style>

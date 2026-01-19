<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { getUserList } from '@/api/user'

type PickMode = 'single' | 'multiple'

export interface UserOption {
  account: string
  name: string
}

const props = defineProps<{
  /** v-model 控制显示 */
  modelValue: boolean
  /** 弹窗标题 */
  title?: string
  /** single=单选(主持人) multiple=多选(参会人) */
  mode: PickMode
  /** 默认选中的 account 列表 */
  defaultSelected?: string[]
  /** 默认选中的人员信息（用于回显姓名） */
  defaultSelectedUsers?: UserOption[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  /**
   * 确认时回传：
   * selectedIds: string[] 选中的 account
   * selectedUsers: Array<{account,name}>
   */
  (e: 'confirm', payload: { selectedIds: string[], selectedUsers: UserOption[] }): void
}>()

const show = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v),
})

const userAccount = ref('')
const userName = ref('')

const userLoading = ref(false)
const userLoadingMore = ref(false)
const userOptions = ref<UserOption[]>([])
const userPage = ref(1)
const userHasMore = ref(true)
const userPageSize = 20

const selectedIds = ref<string[]>([])
const expanded = ref(false)
let searchTimer: ReturnType<typeof setTimeout> | null = null

function resolveUserAccount(record: any) {
  return String(
    record?.account,
  ).trim()
}

function resolveUserName(record: any) {
  return String(
    record?.realName,
  ).trim()
}

function resetUserPaging() {
  userPage.value = 1
  userHasMore.value = true
  userOptions.value = []
}

async function loadUsers(isLoadMore = false) {
  if (userLoading.value || userLoadingMore.value)
    return
  if (isLoadMore && !userHasMore.value)
    return

  try {
    if (isLoadMore)
      userLoadingMore.value = true
    else
      userLoading.value = true

    const account = userAccount.value.trim()
    const name = userName.value.trim()
    const params = account || name ? { account, realName: name } : {}

    const response = await getUserList({
      ...params,
      current: userPage.value,
      size: userPageSize,
    })

    const records = response?.data?.data?.records || response?.data?.data || []
    const nextOptions = Array.isArray(records)
      ? records
          .map((item: any) => ({
            account: resolveUserAccount(item),
            name: resolveUserName(item),
          }))
          .filter(item => item.account || item.name)
      : []

    if (isLoadMore)
      userOptions.value = [...userOptions.value, ...nextOptions]
    else
      userOptions.value = nextOptions

    const total = Number(response?.data?.data?.total || 0)
    if (total) {
      userHasMore.value = userOptions.value.length < total
    }
    else {
      userHasMore.value = nextOptions.length >= userPageSize
    }

    if (userHasMore.value)
      userPage.value += 1
  }
  catch (e) {
    console.error('fetch user list failed', e)
    if (!isLoadMore)
      userOptions.value = []
  }
  finally {
    userLoading.value = false
    userLoadingMore.value = false
  }
}

function handleLoadMore() {
  loadUsers(true)
}

function togglePick(account: string) {
  if (!account)
    return

  if (props.mode === 'single') {
    selectedIds.value = selectedIds.value.includes(account) ? [] : [account]
    return
  }

  // multiple
  if (selectedIds.value.includes(account)) {
    selectedIds.value = selectedIds.value.filter(id => id !== account)
  }
  else {
    selectedIds.value = [...selectedIds.value, account]
  }
}

const selectedUsers = computed<UserOption[]>(() => {
  if (!selectedIds.value.length)
    return []
  const map = new Map<string, UserOption>()
  ;(props.defaultSelectedUsers || []).forEach((user) => {
    if (user?.account)
      map.set(user.account, user)
  })
  userOptions.value.forEach((option) => {
    if (option?.account)
      map.set(option.account, option)
  })
  return selectedIds.value.map((account) => {
    const option = map.get(account)
    return { account, name: option?.name || account }
  })
})

const displayedSelectedUsers = computed(() => {
  if (props.mode === 'single')
    return selectedUsers.value
  return expanded.value ? selectedUsers.value : selectedUsers.value.slice(0, 6)
})

const shouldShowToggle = computed(() => props.mode === 'multiple' && selectedUsers.value.length > 6)

function toggleExpanded() {
  expanded.value = !expanded.value
}

function resetUserSearch() {
  userAccount.value = ''
  userName.value = ''
  resetUserPaging()
  loadUsers()
}

function close() {
  show.value = false
}

function confirm() {
  emit('confirm', {
    selectedIds: selectedIds.value.slice(),
    selectedUsers: selectedUsers.value.slice(),
  })
  close()
}

/** 打开时：初始化默认选中 + 拉取人员列表 */
watch(
  () => show.value,
  (v) => {
    if (!v)
      return
    selectedIds.value = (props.defaultSelected || []).filter(Boolean)
    expanded.value = false
    resetUserPaging()
    loadUsers()
  },
)

watch([userAccount, userName], () => {
  if (!show.value)
    return
  if (searchTimer)
    clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    resetUserPaging()
    loadUsers()
  }, 300)
})
</script>

<template>
  <wd-action-sheet v-model="show" :title="title || '选择人员'" :close-on-click-action="true">
    <view class="picker-sheet">
      <view class="picker-header px-4 pt-3">
        <view class="flex items-center gap-2 rounded-3 bg-#f3f4f6 px-3 py-2">
          <wd-icon name="search" size="16px" color="#9aa0a6" />
          <wd-input
            v-model="userAccount"
            placeholder="搜索账号"
            custom-class="meeting-form-input w-full"
            align-right
            :no-border="true"
          />
          <wd-input
            v-model="userName"
            placeholder="搜索姓名"
            custom-class="meeting-form-input w-full"
            align-right
            :no-border="true"
          />
          <view
            class="h-6 w-6 flex items-center justify-center rounded-full bg-white text-#c4c7cc"
            @click="resetUserSearch"
          >
            <wd-icon name="close" size="12px" color="#c4c7cc" />
          </view>
        </view>

        <view class="mt-2 flex items-center justify-between text-3 text-#9aa0a6">
          <text>已选 {{ selectedIds.length }} 人</text>
          <text>{{ mode === 'single' ? '点击姓名选择' : '点击姓名可多选' }}</text>
        </view>
        <view v-if="selectedUsers.length" class="my-3">
          <view class="flex flex-wrap gap-2">
            <view
              v-for="person in displayedSelectedUsers"
              :key="person.account"
              class="flex items-center gap-1 rounded-full bg-#eef2ff px-2 py-1 text-3 text-#4f7bff"
              @click="togglePick(person.account)"
            >
              <text>{{ person.name }}</text>
              <wd-icon name="close" size="10px" color="#4f7bff" />
            </view>
          </view>

          <view v-if="shouldShowToggle" class="mt-2 text-right text-3 text-#4f7bff">
            <text @click="toggleExpanded">
              {{ expanded ? '收起' : '展开' }}
            </text>
          </view>
        </view>
      </view>

      <scroll-view class="picker-body px-4 pb-4" scroll-y :lower-threshold="40" @scrolltolower="handleLoadMore">
        <view v-if="userLoading" class="py-4 text-center text-3 text-#9aa0a6">
          正在加载...
        </view>
        <view v-else-if="userOptions.length === 0" class="py-4 text-center text-3 text-#9aa0a6">
          暂无人员数据
        </view>

        <view
          v-for="option in userOptions"
          :key="option.account"
          class="flex items-center justify-between rounded-3 px-2 py-3 hover:bg-#f6f7fb"
          @click="togglePick(option.account)"
        >
          <view class="flex items-center gap-3">
            <view class="h-8 w-8 flex items-center justify-center rounded-2 bg-#eef2ff text-3 text-#4f7bff font-600">
              {{ (option.name || option.account).slice(0, 1) }}
            </view>
            <view class="flex flex-col">
              <text class="text-3 text-#2f2f2f">
                {{ option.name || option.account }}
              </text>
              <text v-if="option.name && option.account" class="text-3 text-#9aa0a6">
                {{ option.account }}
              </text>
            </view>
          </view>

          <view
            class="h-6 w-6 flex items-center justify-center border border-#e3e6ee rounded-full"
            :class="selectedIds.includes(option.account) ? 'bg-#4f7bff text-white border-#4f7bff' : 'bg-white text-transparent'"
          >
            <wd-icon name="check" size="12px" :color="selectedIds.includes(option.account) ? '#ffffff' : '#ffffff'" />
          </view>
        </view>

        <view v-if="userLoadingMore" class="py-3 text-center text-3 text-#9aa0a6">
          正在加载更多...
        </view>
        <view v-else-if="!userHasMore && userOptions.length" class="py-3 text-center text-3 text-#c2c6cc">
          没有更多了
        </view>
      </scroll-view>

      <view class="picker-footer px-4">
        <wd-button custom-class="w-48%" type="info" @click="close">
          取消
        </wd-button>

        <wd-button custom-class="w-48%" type="primary" @click="confirm">
          确认
        </wd-button>
      </view>
    </view>
  </wd-action-sheet>
</template>

<style scoped>
.picker-sheet {
  display: flex;
  flex-direction: column;
  height: 72vh;
}

.picker-header {
  position: sticky;
  top: 0;
  z-index: 2;
  background: #ffffff;
}

.picker-body {
  flex: 1;
  min-height: 0;
  width: 100%;
  box-sizing: border-box;
}

.picker-footer {
  position: sticky;
  bottom: 0;
  z-index: 2;
  background: #ffffff;
  display: flex;
  justify-content: space-between;
}
</style>

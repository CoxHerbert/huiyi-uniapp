<template>
  <div class="meeting-page">
    <van-nav-bar title="会议" left-arrow @click-left="goBack" />

    <div class="meeting-page__actions">
      <div class="meeting-action">
        <div class="meeting-action__icon">
          <van-icon name="video" />
        </div>
        <div class="meeting-action__label">预约会议</div>
      </div>
      <div class="meeting-action">
        <div class="meeting-action__icon">
          <van-icon name="clock-o" />
        </div>
        <div class="meeting-action__label">历史会议</div>
      </div>
    </div>

    <div class="meeting-page__list">
      <div class="meeting-page__title">预约会议列表</div>

      <div v-for="section in meetingSections" :key="section.date" class="meeting-section">
        <div class="meeting-section__date">{{ section.date }}</div>
        <div v-for="item in section.items" :key="item.id" class="meeting-card">
          <div class="meeting-card__header">
            <span v-if="item.status" :class="['meeting-card__status', item.statusClass]">
              {{ item.status }}
            </span>
            <div class="meeting-card__title">{{ item.title }}</div>
            <van-icon name="ellipsis" class="meeting-card__more" />
          </div>
          <div class="meeting-card__time">{{ item.time }}</div>
          <div v-if="item.tip" class="meeting-card__tip">{{ item.tip }}</div>
          <div class="meeting-card__meta">
            <div>创建者：{{ item.creator }}</div>
            <div>参会人：{{ item.participants }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const meetingSections = [
  {
    date: '今天 1月8日',
    items: [
      {
        id: 1,
        status: '待开始',
        statusClass: 'status-warning',
        title: '会议名称超过十二个字就为...',
        time: '下午14:00-15:00',
        creator: '张浩',
        participants: '张浩 张浩 张浩 张浩 张浩 ...等共20人',
      },
      {
        id: 2,
        status: '待进入',
        statusClass: 'status-primary',
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
];

const goBack = () => {
  router.back();
};
</script>

<style scoped>
.meeting-page {
  min-height: 100vh;
  background: #f6f7f9;
}

.meeting-page__actions {
  display: flex;
  gap: 16px;
  padding: 12px 16px 8px;
  background: #fff;
}

.meeting-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 16px;
  border-radius: 12px;
  background: #f5f7ff;
  color: #3f5fff;
  font-size: 12px;
  flex: 1;
}

.meeting-action__icon {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e7edff;
  font-size: 18px;
}

.meeting-page__list {
  padding: 0 16px 16px;
}

.meeting-page__title {
  margin: 16px 0 12px;
  font-size: 16px;
  font-weight: 600;
  color: #2f2f2f;
}

.meeting-section__date {
  margin-bottom: 8px;
  font-size: 12px;
  color: #9aa0a6;
}

.meeting-card {
  background: #fff;
  border-radius: 12px;
  padding: 12px 12px 10px;
  box-shadow: 0 4px 12px rgba(31, 35, 41, 0.04);
  margin-bottom: 12px;
}

.meeting-card__header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.meeting-card__status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 10px;
  line-height: 1.4;
}

.status-warning {
  color: #ff9f1a;
  background: #fff4e5;
}

.status-primary {
  color: #3f5fff;
  background: #e7edff;
}

.meeting-card__title {
  flex: 1;
  font-weight: 600;
  font-size: 14px;
  color: #2f2f2f;
  line-height: 1.4;
}

.meeting-card__more {
  color: #c2c6cc;
  font-size: 16px;
}

.meeting-card__time {
  margin-top: 6px;
  font-size: 13px;
  color: #5c6066;
}

.meeting-card__tip {
  margin-top: 4px;
  font-size: 12px;
  color: #ff7a00;
}

.meeting-card__meta {
  margin-top: 8px;
  font-size: 12px;
  color: #9aa0a6;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
</style>

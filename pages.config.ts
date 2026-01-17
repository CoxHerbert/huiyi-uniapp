/*
 * @Author: weisheng
 * @Date: 2025-06-23 22:23:05
 * @LastEditTime: 2025-06-27 13:04:54
 * @LastEditors: weisheng
 * @Description:
 * @FilePath: /wot-starter/pages.config.ts
 * 记得注释
 */
import { defineUniPages } from '@uni-helper/vite-plugin-uni-pages'

export default defineUniPages({
  pages: [{
    path: 'pages/index/index',
    type: 'page',
    name: 'login',
    style: {
      navigationBarTitleText: '登录',
    },
  }, {
    path: 'pages/meeting/create',
    type: 'page',
    name: 'meeting-create',
    style: {
      navigationBarTitleText: '创建会议',
      usingComponents: {
        'wd-calendar': 'wot-design-uni/components/wd-calendar/wd-calendar',
      },
    },
  }, {
    path: 'pages/meeting/detail',
    type: 'page',
    name: 'meeting-detail',
    style: {
      navigationBarTitleText: '会议详情',
    },
  }, {
    path: 'pages/meeting/edit',
    type: 'page',
    name: 'meeting-edit',
    style: {
      navigationBarTitleText: '编辑会议',
      usingComponents: {
        'wd-calendar': 'wot-design-uni/components/wd-calendar/wd-calendar',
      },
    },
  }, {
    path: 'pages/meeting/history-detail',
    type: 'page',
    name: 'meeting-history-detail',
    style: {
      navigationBarTitleText: '历史会议详情',
    },
  }, {
    path: 'pages/meeting/history',
    type: 'page',
    name: 'meeting-history',
    style: {
      navigationBarTitleText: '历史会议',
    },
  }, {
    path: 'pages/meeting/index',
    type: 'page',
    name: 'meeting',
    layout: 'tabbar',
    style: {
      navigationBarTitleText: '会议',
    },
  }, {
    path: 'pages/settings/index',
    type: 'page',
    name: 'settings',
    layout: 'tabbar',
    style: {
      navigationBarTitleText: '我的',
    },
  }],
  globalStyle: {
    // 导航栏配置
    navigationBarBackgroundColor: '@navBgColor',
    navigationBarTextStyle: '@navTxtStyle',
    navigationBarTitleText: 'Wot Starter',

    // 页面背景配置
    backgroundColor: '@bgColor',
    backgroundTextStyle: '@bgTxtStyle',
    backgroundColorTop: '@bgColorTop',
    backgroundColorBottom: '@bgColorBottom',

    // 下拉刷新配置
    enablePullDownRefresh: false,
    onReachBottomDistance: 50,

    // 动画配置
    animationType: 'pop-in',
    animationDuration: 300,
  },
  tabBar: {
    custom: true,
    // #ifdef MP-ALIPAY
    customize: true,
    // 暂时不生效。4.71.2025061206-alpha已修复：https://uniapp.dcloud.net.cn/release-note-alpha.html#_4-71-2025061206-alpha，我们等正式版发布后更新。
    overlay: true,
    // #endif
    height: '0',
    color: '@tabColor',
    selectedColor: '@tabSelectedColor',
    backgroundColor: '@tabBgColor',
    borderStyle: '@tabBorderStyle',
    list: [
      {
        pagePath: 'pages/meeting/index',
      },
      {
        pagePath: 'pages/settings/index',
      },
    ],
  },
})

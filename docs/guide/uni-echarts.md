---
title: uni-echarts
iframe: true
---
# Echarts

在移动端跨平台开发中，数据可视化是一个常见需求。而 ECharts 作为百度开源的强大图表库，在 Web 端有着广泛的应用，我们在技术栈选择的时候往往倾向于选择这种应用广泛，解决方案完善的库。

但在 uni-app 中直接使用 ECharts 会遇到各种兼容性问题，特别是在小程序端。幸运的是，有很多库可以帮助我们在 `uni-app` 中使用 `Echarts`，例如 `uni-echarts`、`lime-echart` 等插件，为我们提供了相应的解决方案。

本章节中，我们将会在 wot-starter 中，探索 uni-app 接入 `Echarts` 的方案，并针对小程序，对其超级庞大的体积进行优化。

## 为什么选择 uni-echarts？

[uni-echarts](https://github.com/xiaohe0601/uni-echarts) 是一个适用于 uni-app 的 Apache ECharts 组件（仅支持Vue 3），具有以下优势：

- 🚀 **快速上手**：与 [Vue ECharts](https://github.com/ecomfe/vue-echarts) 近乎一致的使用体验
- 📱 **多端兼容**：支持 H5、小程序、APP 等多个平台
- 📦 **支持 easycom**：无需手动导入，开箱即用
- ☕ **TypeScript 支持**：完整的类型定义
- 🍳 **免费商用**：基于 MIT 许可协议

基于以上，选择使用 `uni-echarts` 作为我们的图表库，当然也可以选择 [lime-echart](https://ext.dcloud.net.cn/plugin?id=4899) 。

## 安装和配置

### 1. 安装依赖

首先安装必要的依赖包：

```bash
pnpm add echarts uni-echarts
# 或者
npm install echarts uni-echarts
```

在我们的项目中，`package.json` 已经包含了这些依赖：

```json
{
  "dependencies": {
    "echarts": "^6.0.0",
    "uni-echarts": "^1.1.2"
  }
}
```

### 2. Vite 配置

在 `vite.config.ts` 中添加必要的配置：

```typescript
import { defineConfig } from 'vite'
import Uni from '@dcloudio/vite-plugin-uni'
import UniHelperComponents from '@uni-helper/vite-plugin-uni-components'
import { UniEchartsResolver } from 'uni-echarts/resolver'

export default defineConfig({
  optimizeDeps: {
    exclude: process.env.NODE_ENV === 'development' ? ['wot-design-uni', 'uni-echarts'] : [],
  },
  plugins: [
    // 组件自动导入
    UniHelperComponents({
      resolvers: [UniEchartsResolver()],
      dts: 'src/components.d.ts',
    }),
    Uni(),
  ],
})
```

这样配置后，`uni-echarts` 组件就可以在项目中自动导入使用了，更多信息参见 [Uni ECharts 快速开始](https://uni-echarts.xiaohe.ink/guide/getting-started)。

## 基础使用示例

### 创建一个柱状图组件

让我们以项目中的 `BarChart.vue` 为例，看看如何创建一个基础的柱状图：

```vue
<script setup lang="ts">
import { BarChart } from 'echarts/charts'
import { DatasetComponent, GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import * as echarts from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { provideEcharts } from 'uni-echarts/shared'

// 🚨 重要：由于 npm 插件编译机制问题，需要手动提供 echarts 实例
provideEcharts(echarts)

// 注册需要的组件
echarts.use([
  GridComponent,
  LegendComponent,
  TooltipComponent,
  DatasetComponent,
  BarChart,
  CanvasRenderer,
])

// 图表配置
const option = ref({
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow',
    },
  },
  legend: {
    data: ['销售额', '利润'],
    top: 30,
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true,
  },
  xAxis: {
    type: 'category',
    data: ['1月', '2月', '3月', '4月', '5月', '6月'],
  },
  yAxis: {
    type: 'value',
  },
  series: [
    {
      name: '销售额',
      type: 'bar',
      data: [120, 200, 150, 80, 70, 110],
      itemStyle: {
        color: '#5470c6',
      },
    },
    {
      name: '利润',
      type: 'bar',
      data: [20, 40, 30, 15, 12, 22],
      itemStyle: {
        color: '#91cc75',
      },
    },
  ],
})
</script>

<template>
  <uni-echarts custom-class="h-300px" :option="option" />
</template>
```

### 关键要点说明

1. **provideEcharts(echarts)**：这是使用 uni-echarts 的关键步骤，必须在每个组件中调用
2. **按需导入**：只导入需要的图表类型和组件，减小打包体积
3. **echarts.use()**：注册导入的组件
4. **uni-echarts 组件**：使用 `<uni-echarts>` 标签渲染图表

## 更多图表类型
更多图表类型见 [Echarts](https://echarts.apache.org/examples/zh/index.html) 和 [Uni ECharts](https://uni-echarts.xiaohe.ink/examples/basic)，当然你也可以使用 AI 工具帮助你编写想要的图表配置，它非常善于处理这个事情。


## 注意事项和最佳实践

### 1. 使用 npm 方式安装必须调用 provideEcharts

在每个使用 ECharts 的组件中，都必须调用 `provideEcharts(echarts)`：

```javascript
import * as echarts from 'echarts/core'
import { provideEcharts } from 'uni-echarts/shared'

// 🚨 这一行是必须的
provideEcharts(echarts)
```

### 2. 按需导入组件

为了减小打包体积，建议按需导入需要的图表类型和组件：

```javascript
// 只导入需要的图表类型
import { BarChart, LineChart, PieChart } from 'echarts/charts'
// 只导入需要的组件
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
// 导入渲染器
import { CanvasRenderer } from 'echarts/renderers'
```

### 3. 设置图表尺寸

使用 `custom-class` 属性设置图表容器的尺寸：

```vue
<template>
  <!-- 使用 UnoCSS/Tailwind 类名 -->
  <uni-echarts custom-class="h-300px w-full" :option="option" />

  <!-- 或者使用自定义 CSS 类 -->
  <uni-echarts custom-class="chart-container" :option="option" />
</template>

<style>
.chart-container {
  width: 100%;
  height: 300px;
}
</style>
```

### 4. 响应式数据更新

当需要动态更新图表数据时，直接修改 `option` 对象即可：

```javascript
const option = ref({
  // 初始配置
})

// 更新数据
function updateData() {
  option.value.series[0].data = [/* 新数据 */]
}
```

### 5. 主题定制

可以通过 `provideEchartsTheme` 来设置自定义主题：

```javascript
import { provideEcharts, provideEchartsTheme } from 'uni-echarts/shared'
import * as echarts from 'echarts/core'

provideEcharts(echarts)

// 设置自定义主题
provideEchartsTheme({
  color: ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de'],
  backgroundColor: 'transparent',
  // 更多主题配置...
})
```

## 卸载步骤

如果你不再需要在项目中使用 ECharts，可以按照以下步骤完全卸载相关依赖和配置：

### 1. 卸载依赖包

首先卸载 ECharts 相关的依赖包：

```bash
pnpm remove echarts uni-echarts
```

### 2. 清理 Vite 配置

在 `vite.config.ts` 中移除 ECharts 相关的配置：

```typescript
import { defineConfig } from 'vite'
import Uni from '@dcloudio/vite-plugin-uni'
import UniHelperManifest from '@uni-helper/vite-plugin-uni-manifest'
import UniHelperPages from '@uni-helper/vite-plugin-uni-pages'
import UniHelperLayouts from '@uni-helper/vite-plugin-uni-layouts'
import UniHelperComponents from '@uni-helper/vite-plugin-uni-components'
import AutoImport from 'unplugin-auto-import/vite'
import { WotResolver } from '@uni-helper/vite-plugin-uni-components/resolvers'
import { UniEchartsResolver } from 'uni-echarts/resolver' // [!code --]
import UniKuRoot from '@uni-ku/root'

export default async () => {
  const UnoCSS = (await import('unocss/vite')).default

  return defineConfig({
    optimizeDeps: {
      exclude: process.env.NODE_ENV === 'development' ? ['wot-design-uni', 'uni-echarts'] : [], // [!code --]
      exclude: process.env.NODE_ENV === 'development' ? ['wot-design-uni',] : [], // [!code ++]
    },
    plugins: [
      UniHelperManifest(),
      UniHelperPages({
        dts: 'src/uni-pages.d.ts',
        subPackages: [],
        exclude: ['**/components/**/*.*'],
      }),
      UniHelperLayouts(),
      UniHelperComponents({
        resolvers: [WotResolver(), UniEchartsResolver()], // [!code --]
        resolvers: [WotResolver()], // [!code ++]
        dts: 'src/components.d.ts',
        dirs: ['src/components', 'src/business'],
        directoryAsNamespace: true,
      }),
      UniKuRoot(),
      Uni(),
      // https://github.com/uni-ku/bundle-optimizer
      Optimization({
        logger: true,
      }),
      AutoImport({
        imports: ['vue', '@vueuse/core', 'pinia', 'uni-app', {
          from: '@wot-ui/router',
          imports: ['createRouter', 'useRouter', 'useRoute'],
        }, {
          from: 'wot-design-uni',
          imports: ['useToast', 'useMessage', 'useNotify', 'CommonUtil'],
        }, {
          from: 'alova/client',
          imports: ['usePagination', 'useRequest'],
        }],
        dts: 'src/auto-imports.d.ts',
        dirs: ['src/composables', 'src/store', 'src/utils', 'src/api'],
        vueTemplate: true,
      }),
      UnoCSS(),
    ],
  })
}
```

## 总结

我们在 `wot-starter` 中 使用 `uni-echarts` 结合 `@uni-ku/bundle-optimizer` 为 `uni-app` 开发者提供了一个完整的高性能 ECharts 解决方案。通过合理的配置和规范的使用方式，我们可以在各个平台上实现丰富的数据可视化效果，同时保证应用的性能和用户体验。

## 参考资源

- [uni-echarts 官方文档](https://uni-echarts.xiaohe.ink)
- [@uni-ku/bundle-optimizer](https://github.com/uni-ku/bundle-optimizer)
- [ECharts 官方文档](https://echarts.apache.org/zh/index.html)
- [lime-echart](https://ext.dcloud.net.cn/plugin?id=4899)

import process from 'node:process'
import Uni from '@uni-helper/plugin-uni'
import { isMpWeixin } from '@uni-helper/uni-env'
import UniHelperComponents from '@uni-helper/vite-plugin-uni-components'
import { WotResolver } from '@uni-helper/vite-plugin-uni-components/resolvers'
import UniHelperLayouts from '@uni-helper/vite-plugin-uni-layouts'
import UniHelperManifest from '@uni-helper/vite-plugin-uni-manifest'
import UniHelperPages from '@uni-helper/vite-plugin-uni-pages'
import Optimization from '@uni-ku/bundle-optimizer'
import UniKuRoot from '@uni-ku/root'
import { UniEchartsResolver } from 'uni-echarts/resolver'
import { UniEcharts } from 'uni-echarts/vite'
import UnoCSS from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  base: './',

  /**
   * ✅ 关键：统一把构建目标降到 ES2015，避免 vendor.js 出现 ?. / ??
   * - 微信小程序运行环境对现代语法支持不完整
   * - 微信开发者工具的“ES6->ES5”有时对 vendor 处理不稳定，最好产物本身就兼容
   */
  esbuild: {
    target: 'es2015',
  },

  build: {
    target: 'es2015',
    // 默认 esbuild 压缩即可（不要换成 terser，除非你有特殊需求）
    minify: 'esbuild',
  },

  /**
   * dev 依赖预构建也尽量降级（可减少开发模式 vendor 里混入新语法）
   */
  optimizeDeps: {
    // 你原来的 exclude 保留
    exclude: process.env.NODE_ENV === 'development' ? ['wot-design-uni', 'uni-echarts'] : [],
    // ✅ 增加：预构建 target
    esbuildOptions: {
      target: 'es2015',
    },
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
      resolvers: [WotResolver(), UniEchartsResolver()],
      dts: 'src/components.d.ts',
      dirs: ['src/components', 'src/business'],
      directoryAsNamespace: true,
    }),

    UniKuRoot(),

    UniEcharts(),

    Uni(),

    Optimization({
      enable: isMpWeixin,
      logger: false,
    }),

    AutoImport({
      imports: [
        'vue',
        '@vueuse/core',
        'pinia',
        'uni-app',
        {
          from: '@wot-ui/router',
          imports: ['createRouter', 'useRouter', 'useRoute'],
        },
        {
          from: 'wot-design-uni',
          imports: ['useToast', 'useMessage', 'useNotify', 'CommonUtil'],
        },
        {
          from: 'alova/client',
          imports: ['usePagination', 'useRequest'],
        },
      ],
      dts: 'src/auto-imports.d.ts',
      dirs: ['src/composables', 'src/store', 'src/utils', 'src/api'],
      vueTemplate: true,
    }),

    UnoCSS(),
  ],
})

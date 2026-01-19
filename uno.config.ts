import { presetUni } from '@uni-helper/unocss-preset-uni'

import {
  defineConfig,
  presetIcons,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'

export default defineConfig({
  safelist: [
    'bg-#fff4e5',
    'text-#ff9f1a',
    'bg-#e8f7f0',
    'text-#1e8e5a',
    'bg-#f1f2f4',
    'text-#8a8f99',
    'bg-#fdeaea',
    'text-#ff4d4f',
    'bg-#e7edff',
    'text-#3f5fff',
  ],
  presets: [
    presetUni({
      attributify: false,
    }),
    presetIcons({
      scale: 1.2,
      warn: true,
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'middle',
      },
      // HBuilderX 必须针对要使用的 Collections 做异步导入
      // collections: {
      //   carbon: () => import('@iconify-json/carbon/icons.json').then(i => i.default),
      // },
    }),
  ],
  transformers: [
    transformerDirectives(),
    transformerVariantGroup(),
  ],
})

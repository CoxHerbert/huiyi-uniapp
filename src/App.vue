<script setup lang="ts">
import { checkMiniProgramUpdate } from '@/utils/update'

onLaunch(() => {
  checkMiniProgramUpdate()
})
</script>

<style lang="scss">
.page-wraper {
  min-height: calc(100vh - var(--window-top));
  box-sizing: border-box;
  background: #f9f9f9;
}

.wot-theme-dark.page-wraper {
  background: #222;
}
</style>

<script setup>
import Header from "@/components/Header/index.vue";
import PageSide from "@/components/PageSide/index.vue";
import PageSetting from "@/components/PageSetting/index.vue";
import MainCanvas from "@/views/main-canvas.vue";

</script>

<template>
  <div class="engage w-screen h-screen">
    <el-container class="w-screen h-screen">
      <el-header><Header></Header></el-header>
      <el-container class="border-t-width-$1 border-light-400">
        <el-aside width="180px">
          <PageSide></PageSide>
        </el-aside>
        <el-main class="flex-1 p-0">
          <MainCanvas></MainCanvas>
        </el-main>
        <el-aside width="200px">
          <PageSetting></PageSetting>
        </el-aside>
      </el-container>
    </el-container>
  </div>

  <!-- <div class="divide-y-2 divide-gray-500">
    <div class="my-4 mx-4">按钮</div>
    <div class="my-4 mx-4">按钮</div>
  </div> -->
</template>

<style lang="scss" scoped>
// .btn {
//   @apply bg-purple-500 text-indigo-50 px-4 py-2 rounded-full focus:(ring-8 ring-purple-900) transition-all duration-500 hover:(bg-purple-900);
// }
</style>

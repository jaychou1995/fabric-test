<template>
  <div class="engage-header flex w-full h-full items-center">
    <div class="logo-info flex items-center w-60 justify-between">
      <div class="flex items-center">
        <div class="logo"></div>
        <div class="text-warm-gray-700 font-semibold">test</div>
      </div>
      <div class="engage-play">
        <el-button type="primary" icon="Edit" />
      </div>
    </div>

    <div class="engage-header-manage flex-1">
      <div class="model-box flex items-center justify-center">
        <el-button size="large" text icon="Edit" />
        <el-button size="large" text icon="Edit" />
        <el-button size="large" text icon="Edit" />
        <el-button size="large" text icon="Edit" />
        <el-button size="large" text icon="Edit" />
        <el-button size="large" text icon="Edit" />
        <el-button size="large" text icon="Edit" />
        <el-button size="large" text icon="Edit" />
      </div>
    </div>

    <div class="engage-header-user w-48">
      <div class="flex items-center justify-center">
        <el-icon class="mx-2"><User /></el-icon>
        <el-icon class="mx-2"><User /></el-icon>
        <el-icon class="mx-2"><User /></el-icon>
      </div>
    </div>
  </div>
</template>

<script setup></script>

<style lang="scss" scoped>
.engage-header {
  background-color: #fff;
}
</style>

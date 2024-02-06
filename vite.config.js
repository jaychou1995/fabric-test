import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";
import path from "path";
import WindiCSS from "vite-plugin-windicss";
import { ElectronDevPlugin } from "./plugins/vite.electron.dev.js";
import { ElectronBuildPlugin } from "./plugins/vite.electron.build.js";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    WindiCSS(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
    ElectronDevPlugin(),
    ElectronBuildPlugin(),
  ],
  base: "./", // 默认是绝对路径,要改成相对路径
  resolve: {
    alias: {
      "@": path.resolve("./src"),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        javascriptEnabled: true,
        // 两种方式都可以
        additionalData: '@import "@/styles/global.scss";',
        // additionalData: '@use "@/assets/scss/global.scss" as *;'
      },
    },
  },
  build: {
    rollupOptions:{
      input: {
        main: 'src/main.js', // 其他文件的入口
        background: 'src/background.js', // 要单独打包的文件的入口
      },
      output: {
        entryFileNames: '[name].[hash].js', // 其他文件的输出名称
        chunkFileNames: 'background.js', // 单独打包文件的输出名称
      },
    }
  }
});

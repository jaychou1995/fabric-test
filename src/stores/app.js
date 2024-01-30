import { defineStore } from "pinia";

export const appStore = defineStore("appStore", {
  state: () => {
    return {
      _DPR: window.devicePixelRatio, // 设备dpr
    };
  },
});

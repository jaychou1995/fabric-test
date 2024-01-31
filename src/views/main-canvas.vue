<template>
  <div class="main-canvas w-full h-full">
    <canvas
      id="canvasContainer"
      ref="canvasContainer"
      class="canvas-container w-full h-full"
    ></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import Canvas from "@/canvas/index.js";
// import { appStore } from "../stores/app";
// const useappStore = appStore();
const canvasContainer = ref(null);
onMounted(() => {
  const canvas = new Canvas.Canvas(canvasContainer.value);

  const rect = new Canvas.CanvasObject({
    top: 0,
    left: 0,
    width: 100,
    height: 100,
    fill: "#4169E1",
    graphical: "rect",
  });

  canvas.add(rect);
});
</script>

<!-- <script setup>
import { ref, onMounted } from "vue";
import jcanvas from "@/jcanvas/index.js";
// import { appStore } from "../stores/app";
// const useappStore = appStore();
const canvasContainer = ref(null);
onMounted(() => {
  const canvas = new jcanvas.Canvas(canvasContainer.value);
  // console.log(canvas);

  const rect = new jcanvas.Rect({
    top: 0,
    left: 0,
    width: 100,
    height: 100,
    fill: "#4169E1",
  });

  const rect2 = new jcanvas.Rect({
    top: 400,
    left: 400,
    width: 100,
    height: 100,
    fill: "pink",
  });

  // console.log(rect);
  rect2.on("added", (res) => {
    console.log("rect 被添加了", res);
  });
  canvas.add(rect, rect2);
  // canvas.add(rect2);
});
</script> -->

<style scoped lang="scss"></style>

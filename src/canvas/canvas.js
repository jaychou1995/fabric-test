import EventCenter from "./EventCenter";
import Util from "./utils";

import SelectModel from "./select";

export default class Canvas extends EventCenter {
  wrapperEl; //所有canvas的外层div
  width; //画布宽度
  height; //画布高度
  backgroundColor; //画布背景颜色
  lowerCanvasEl; //下层 canvas 画布，主要用于绘制所有物体
  upperCanvasEl; //上层 canvas，主要用于监听鼠标事件、涂鸦模式、左键点击拖蓝框选区域
  cacheCanvasEl; //缓冲层画布环境，方便某些情况方便计算用的，比如检测物体是否透明
  lowerCanvasElCtx; // 画布getContext('2d')的环境
  upperCanvasElCtx;
  cacheCanvasElCtx;
  dpr = window.devicePixelRatio;

  _objects = []; //画布中所有的图形
  _activeObject; //当前激活的图形
  /** 当前选中的组 */
  _activeGroup;

  _currentTransform; // 图形点击激活前保存一些图形的信息
  pointerDownOffsetWindowPoint; // 点击鼠标点位距离屏幕相对位置
  _pointerDownOffsetCanvasPoint; //点击鼠标点位距离画布相对位置
  _offset; // 画布距离屏幕位置offset

  canvasModel = "select";
  __canvasModelList = {
    select: new SelectModel(),
  };

  constructor(el) {
    super();

    // 创建下层画布 lower-canvas
    this._createLowerCanvas(el);

    //创建canvas外面的包围容器 因为使用了多个canvas 要在下层画布创建后面
    this._initWrapperElement();

    // 创建上层画布 upper-canvas
    this._createUpperCanvas();
    // 创建缓冲层画布
    this._createCacheCanvas();

    //根据dpr重新设置canvas大小
    this._initRetinaScaling();

    //初始化监听事件
    this._initEvents();

    //初始化其他数据 处理数据
    this._initData();
  }
  /** 添加元素
   * 目前的模式是调用 add 添加物体的时候就立马渲染，
   * 如果一次性加入大量元素，就会做很多无用功，
   * 所以可以加一个属性来先批量添加元素，最后再一次渲染（手动调用 renderAll 函数即可）
   */
  add(...args) {
    //一次性将[]中对象push进去
    this._objects.push.apply(this._objects, args);
    console.log("this._objects", this._objects);
    // console.log("canvas", this);

    for (let i = args.length; i--; ) {
      let obj = args[i];
      obj.setCoords();
      obj.canvas = this;
      this.emit("object:added", { target: obj });
      obj.emit("added");
    }

    this.renderAll();
    return this;
  }

  /** 渲染全部图形,先清空画布再画,大部分是在 lower-canvas 上先画未激活物体，再画激活物体 */
  renderAll(ctx) {
    if (!ctx) ctx = this.lowerCanvasElCtx;

    if (this.upperCanvasElCtx) {
      this.clearContext(this.upperCanvasElCtx);
    }
    this.clearContext(this.lowerCanvasElCtx);

    this.emit("before:render");

    // 先绘制未激活物体，再绘制激活物体 给图形排序
    const sortedObjects = this._chooseObjectsToRender();
    for (let i = 0, len = sortedObjects.length; i < len; ++i) {
      this._draw(ctx, sortedObjects[i]);
    }

    this.emit("after:render");
  }

  /**
   * @description: 清除某一区域画布
   * @return {*}
   */
  clearContext(ctx) {
    ctx && ctx.clearRect(0, 0, this.width, this.height);
    return this;
  }

  /**
   * @description: 绘制
   * @param {*} ctx
   * @param {*} object
   * @return {*}
   */
  _draw(ctx, object) {
    if (!object) return;
    object.render(ctx);
  }

  /** 将所有物体分成两个组，一组是未激活态，一组是激活态，然后将激活组放在最后，这样就能够绘制到最上层 */
  _chooseObjectsToRender() {
    // 当前有没有激活的物体
    let activeObject = this._activeObject;
    // 当前有没有激活的组（也就是多个物体）
    let activeGroup = this._activeGroup;

    // 最终要渲染的物体顺序，也就是把激活的物体放在后面绘制
    let objsToRender = [];

    if (activeGroup) {
      // 如果选中多个物体
      const activeGroupObjects = [];
      for (let i = 0, length = this._objects.length; i < length; i++) {
        let object = this._objects[i];
        if (activeGroup.contains(object)) {
          activeGroupObjects.push(object);
        } else {
          objsToRender.push(object);
        }
      }
      objsToRender.push(activeGroup);
    } else if (activeObject) {
      // 如果只选中一个物体
      let index = this._objects.indexOf(activeObject);
      objsToRender = this._objects.slice();
      if (index > -1) {
        objsToRender.splice(index, 1);
        objsToRender.push(activeObject);
      }
    } else {
      // 所有物体都没被选中
      objsToRender = this._objects;
    }

    return objsToRender;
  }

  _pointerdown(e) {
    console.log("_pointerdown");
    // this.setoPointerdownPosition(e);
    // let doingModel = this.__canvasModelList[this.canvasModel];
    // doingModel.pointerdown(e, this);
  }
  _pointermove(e) {
    console.log("_pointermove");
    // let doingModel = this.__canvasModelList[this.canvasModel];
    // doingModel.pointermove(e, this);
  }
  _pointerup(e) {
    console.log("_pointerup");
  }

  /**
   * @description: 初始化其他数据 处理数据
   * @return {*}
   */
  _initData() {
    /** this._offset 画布距离屏幕位置offset */
    this._offset = Util.getElementOffset(this.lowerCanvasEl);
    return this;
  }

  /**
   * @description:初始化监听事件 监听上层画布 操作在上层
   * @return {*}
   */
  _initEvents() {
    this.upperCanvasEl.addEventListener(
      "pointerdown",
      this._pointerdown.bind(this),
      false
    );
    this.upperCanvasEl.addEventListener(
      "pointermove",
      this._pointermove.bind(this),
      false
    );
    this.upperCanvasEl.addEventListener(
      "pointerup",
      this._pointerup.bind(this),
      false
    );
  }

  /**
   * @description: 根据dpr重新设置canvas大小
   * @return {*}
   */
  _initRetinaScaling() {
    this.__initRetinaScaling(
      this.lowerCanvasEl,
      this.lowerCanvasElCtx,
      this.dpr
    );
    this.__initRetinaScaling(
      this.upperCanvasEl,
      this.upperCanvasElCtx,
      this.dpr
    );
    this.__initRetinaScaling(
      this.cacheCanvasEl,
      this.cacheCanvasElCtx,
      this.dpr
    );
  }

  __initRetinaScaling(canvas, ctx, dpr) {
    const { width, height } = this;
    // 重新设置 canvas 自身宽高大小和 css 大小。放大 canvas；css 保持不变，因为我们需要那么多的点
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    // 直接用 scale 放大整个坐标系，相对来说就是放大了每个绘制操作
    ctx.scale(dpr, dpr);
  }
  /**
   * @description: 创建canvas外面的包围容器 因为使用了多个canvas 要在下层画布创建后面
   * @return {*}
   */
  _initWrapperElement() {
    this.wrapperEl = document.createElement("div");

    //div容器替换canvas 再把canvas放到div中
    this.lowerCanvasEl.parentNode.replaceChild(
      this.wrapperEl,
      this.lowerCanvasEl
    );
    this.wrapperEl.appendChild(this.lowerCanvasEl);

    Util.setStyle(this.wrapperEl, {
      width: this.width + "px",
      height: this.height + "px",
      position: "relative",
      userSelect: "none",
    });
  }

  /**
   * @description: 创建缓冲层画布
   * @return {*}
   */
  _createCacheCanvas() {
    this.cacheCanvasEl = document.createElement("canvas");
    this.cacheCanvasEl.width = this.width;
    this.cacheCanvasEl.height = this.height;
    this.cacheCanvasElCtx = this.cacheCanvasEl.getContext("2d");
  }

  /**
   * @description: 创建上层画布 upper-canvas
   * @return {*}
   */
  _createUpperCanvas() {
    this.upperCanvasEl = document.createElement("canvas");
    this.upperCanvasEl.className = "upper-canvas";
    this.wrapperEl.appendChild(this.upperCanvasEl);
    let width = this.width || this.upperCanvasEl.width;
    let height = this.height || this.upperCanvasEl.height;
    Util.setStyle(this.upperCanvasEl, {
      position: "absolute",
      width: width + "px",
      height: height + "px",
      left: 0,
      top: 0,
      userSelect: "none",
    });
    this.upperCanvasEl.width = width;
    this.upperCanvasEl.height = height;
    this.upperCanvasElCtx = this.upperCanvasEl.getContext("2d");
  }

  /**
   * @description: 创建下层画布 lower-canvas
   * @param {*} el
   * @return {*}
   */
  _createLowerCanvas(el) {
    // 设置画布宽高
    this.lowerCanvasEl = el;
    Util.addClass(this.lowerCanvasEl, "lower-canvas");
    let width = this.width || el.clientWidth;
    let height = this.height || el.clientHeight;
    Util.setStyle(el, {
      position: "absolute",
      width: width + "px",
      height: height + "px",
      left: 0,
      top: 0,
      userSelect: "none",
    });
    el.width = width;
    el.height = height;
    this.width = width;
    this.height = height;
    this.lowerCanvasElCtx = this.lowerCanvasEl.getContext("2d");
  }
}

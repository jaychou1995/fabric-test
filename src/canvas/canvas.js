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

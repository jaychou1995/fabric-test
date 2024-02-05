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

  pointerDownOffsetWindowPoint; // 点击鼠标点位距离屏幕相对位置
  _pointerDownOffsetCanvasPoint; //点击鼠标点位距离画布相对位置
  _offset; // 画布距离屏幕位置offset

  /** 当前物体的变换信息 */
  _currentTransform;

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
    let doingModel = this.__canvasModelList[this.canvasModel];
    let target = doingModel._pointerdown(e, this);

    this.emit("mouse:down", { target, e });
    target && target.emit("mousedown", { e });
  }
  _pointermove(e) {
    let doingModel = this.__canvasModelList[this.canvasModel];
    doingModel._pointermove(e, this);
  }
  _pointerup(e) {
    let doingModel = this.__canvasModelList[this.canvasModel];
    doingModel._pointerup(e, this);
  }

  _setupCurrentTransform(e, target) {
    let action = "drag",
      corner,
      pointer = Util.getPointer(e, target.canvas.upperCanvasEl);

    corner = target._findTargetCorner(e, this._offset);

    if (corner) {
      // 根据点击的控制点判断此次操作是什么
      action =
        corner === "ml" || corner === "mr"
          ? "scaleX"
          : corner === "mt" || corner === "mb"
          ? "scaleY"
          : corner === "mtr"
          ? "rotate"
          : "scale";
    }

    let originX = "center",
      originY = "center";

    if (corner === "ml" || corner === "tl" || corner === "bl") {
      // 如果点击的是左边的控制点，则变换基点就是右边，以右边为基准向左变换
      originX = "right";
    } else if (corner === "mr" || corner === "tr" || corner === "br") {
      originX = "left";
    }

    if (corner === "tl" || corner === "mt" || corner === "tr") {
      // 如果点击的是上方的控制点，则变换基点就是底部，以底边为基准向上变换
      originY = "bottom";
    } else if (corner === "bl" || corner === "mb" || corner === "br") {
      originY = "top";
    }

    if (corner === "mtr") {
      // 如果是旋转操作，则基点就是中心点
      originX = "center";
      originY = "center";
    }

    this._currentTransform = {
      target,
      action,
      scaleX: target.scaleX,
      scaleY: target.scaleY,
      offsetX: pointer.x - target.left,
      offsetY: pointer.y - target.top,
      originX,
      originY,
      ex: pointer.x,
      ey: pointer.y,
      left: target.left,
      top: target.top,
      theta: Util.degreesToRadians(target.angle),
      width: target.width * target.scaleX,
      mouseXSign: 1,
      mouseYSign: 1,
    };
    // 记录物体原始的 original 变换参数
    this._currentTransform.original = {
      left: target.left,
      top: target.top,
      scaleX: target.scaleX,
      scaleY: target.scaleY,
      originX,
      originY,
    };
  }

  /** 将所有物体设置成未激活态 */
  deactivateAll() {
    let allObjects = this._objects,
      i = 0,
      len = allObjects.length;
    for (; i < len; i++) {
      allObjects[i].setActive(false);
    }
    // this.discardActiveGroup();
    // this.discardActiveObject();
    return this;
  }
  /** 设置图形为激活状态 */
  setActiveObject(object) {
    if (this._activeObject) {
      // 如果当前有激活物体
      this._activeObject.setActive(false);
    }
    this._activeObject = object;
    object.setActive(true);
    return this;
  }

  /** 检测是否有物体在鼠标位置 */
  findTarget(e, skipGroup = false) {
    let target;

    // 优先考虑当前组中的物体，因为激活的物体被选中的概率大
    let activeGroup = this._activeGroup;
    if (activeGroup && !skipGroup && this.containsPoint(e, activeGroup)) {
      target = activeGroup;
      return target;
    }

    // 遍历所有物体，判断鼠标点是否在物体包围盒内
    for (let i = this._objects.length; i--; ) {
      if (this._objects[i] && this.containsPoint(e, this._objects[i])) {
        target = this._objects[i];
        break;
      }
    }

    if (target) return target;
  }
  /**
   * @description: 判断鼠标点是否在物体包围盒内
   * @param {*} e
   * @param {*} target
   * @return {*}
   */
  containsPoint(e, target) {
    console.log(e, target);
    let pointer = this.getPointer(e),
      xy = this._normalizePointer(target, pointer),
      x = xy.x,
      y = xy.y;

    // 下面这是参考文献，不过好像打不开
    // http://www.geog.ubc.ca/courses/klink/gis.notes/ncgia/u32.html
    // http://idav.ucdavis.edu/~okreylos/TAship/Spring2000/PointInPolygon.html

    // we iterate through each object. If target found, return it.
    let iLines = target._getImageLines(target.oCoords),
      xpoints = target._findCrossPoints(x, y, iLines);

    // if xcount is odd then we clicked inside the object
    // For the specific case of square images xcount === 1 in all true cases
    if (
      (xpoints && xpoints % 2 === 1) ||
      target._findTargetCorner(e, this._offset)
    ) {
      return true;
    }
    return false;
  }
  /** 如果当前的物体在当前的组内，则要考虑扣去组的 top、left 值 */
  _normalizePointer(object, pointer) {
    let activeGroup = this._activeGroup,
      x = pointer.x,
      y = pointer.y;

    let isObjectInGroup =
      activeGroup && object.type !== "group" && activeGroup.contains(object);

    if (isObjectInGroup) {
      x -= activeGroup.left;
      y -= activeGroup.top;
    }
    return { x, y };
  }

  /**
   * @description: 获取鼠标位置相对于画布的坐标,因为e得到值是相对于屏幕,_offset是偏移量,减去后就是相对于画布
   * @param {*} e
   * @return {*}
   */
  getPointer(e) {
    let pointer = Util.getPointer(e, this.upperCanvasEl);
    return {
      x: pointer.x - this._offset.left,
      y: pointer.y - this._offset.top,
    };
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

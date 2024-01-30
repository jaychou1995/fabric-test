import { EventCenter } from "./EventCenter";
import { Util } from "./utils/index.js";

import { SelectModel } from "./select";

export class Canvas extends EventCenter {
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
  _currentTransform; // 图形点击激活前保存一些图形的信息

  // draw: "draw",  //先设置前三种
  // select: "select",
  // erase: "erase",
  // hand: "hand",
  // text: "text",
  // shape: "shape"
  canvasModel = "select";
  __canvasModelList = {
    select: new SelectModel(),
  };

  _objects = [];
  pointerDownOffsetWindowPoint; // 点击鼠标点位距离屏幕相对位置
  _pointerDownOffsetCanvasPoint; //点击鼠标点位距离画布相对位置
  _offset; // 画布距离屏幕位置offset

  _activeObject; //当前激活的物体

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

    //初始化其他数据
    this._initData();

    // console.log(this.lowerCanvasEl.offsetLeft, this.lowerCanvasEl.offsetTop);
    // console.dir(this.lowerCanvasEl);
  }
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
  _createCacheCanvas() {
    this.cacheCanvasEl = document.createElement("canvas");
    this.cacheCanvasEl.width = this.width;
    this.cacheCanvasEl.height = this.height;
    this.cacheCanvasElCtx = this.cacheCanvasEl.getContext("2d");
  }
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
  _initData() {
    this.calcOffset(); //设置画布距离屏幕位置offset
  }
  calcOffset() {
    this._offset = Util.getElementOffset(this.lowerCanvasEl);
    return this;
  }

  /**
   * @description: 添加元素到画布
   * @return {*}
   */
  add(...args) {
    this._objects.push.apply(this._objects, args);
    this.renderAll();
    return this;
  }

  /**
   * @description: 全部重新渲染
   * @return {*}
   */
  renderAll(ctx) {
    if (!ctx) ctx = this.lowerCanvasElCtx;

    if (this.upperCanvasElCtx) {
      this.clearContext(this.upperCanvasElCtx);
    }
    this.clearContext(this.lowerCanvasElCtx);

    this.emit("before:render");

    for (const obj of this._objects) {
      this.emit("object:added", { target: obj });
      obj.emit("added");
      obj.render(ctx);
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
   * @description: 删除所有物体和清空画布
   * @return {*}
   */
  clearAll() {
    this._objects.length = 0;

    this.clearContext(this.lowerCanvasElCtx);
    this.clearContext(this.upperCanvasElCtx);
  }

  /**
   * @description: 清空所有选中
   * @return {*}
   */
  clearAllObjectActive() {
    let allObjects = this._objects;
    for (const i of allObjects) {
      i.setActive(false);
    }
    this._activeObject = null;
    return this;
  }
  /**
   * @description: 设置物体选中状态
   * @param {*} object
   * @return {*}
   */
  setActiveObject(object) {
    this._activeObject = object;
    object.setActive(true);
  }

  /**
   * @description: 设置_currentTransform
   * @param {*} e
   * @param {*} target
   * @return {*}
   */
  _setupCurrentTransform(e, target) {
    let action = "drag",
      corner,
      pointer = this._pointerDownOffsetWindowPoint;

    corner = this._findTargetCorner(e, target);
    console.log(corner);
  }

  /**
   * @description: 检测哪个控制点被点击了
   * @return {*}
   */
  _findTargetCorner(e, target) {
    if (!this._activeObject) return;

    let ex = this._pointerDownOffsetCanvasPoint.x,
      ey = this._pointerDownOffsetCanvasPoint.y,
      xpoints,
      lines;

    for (let i in target._pointList) {
      lines = this._getImageLines(target._pointList[i].corner);
      console.log(2333, lines);
      xpoints = this._findCrossPoints(ex, ey, lines);
      // console.log(222, i, xpoints);
      if (xpoints % 2 === 1 && xpoints !== 0) {
        return i;
      }
    }
    return false;
  }

  /** 获取包围盒的四条边 */
  _getImageLines(corner) {
    return {
      topline: {
        o: corner.tl,
        d: corner.tr,
      },
      rightline: {
        o: corner.tr,
        d: corner.br,
      },
      bottomline: {
        o: corner.br,
        d: corner.bl,
      },
      leftline: {
        o: corner.bl,
        d: corner.tl,
      },
    };
  }

  /**
   * 射线检测法：以鼠标坐标点为参照，水平向右做一条射线，求坐标点与多条边的交点个数
   * 如果和物体相交的个数为偶数点则点在物体外部；如果为奇数点则点在内部
   * 不过 fabric 的点选多边形都是用于包围盒，也就是矩形，所以该方法是专门针对矩形的，并且针对矩形做了一些优化
   */
  _findCrossPoints(ex, ey, lines) {
    let b1, // 射线的斜率
      b2, // 边的斜率
      a1,
      a2,
      xi, // 射线与边的交点
      // yi, // 射线与边的交点
      xcount = 0,
      iLine; // 当前边

    // 遍历包围盒的四条边
    for (let lineKey in lines) {
      iLine = lines[lineKey];

      // 优化1：如果边的两个端点的 y 值都小于鼠标点的 y 值，则跳过
      if (iLine.o.y < ey && iLine.d.y < ey) continue;
      // 优化2：如果边的两个端点的 y 值都大于鼠标点的 y 值，则跳过
      if (iLine.o.y >= ey && iLine.d.y >= ey) continue;

      // 优化3：如果边是一条垂线
      if (iLine.o.x === iLine.d.x && iLine.o.x >= ex) {
        xi = iLine.o.x;
        // yi = ey;
      } else {
        // 简单计算下射线与边的交点，看式子容易晕，建议自己手动算一下
        b1 = 0;
        b2 = (iLine.d.y - iLine.o.y) / (iLine.d.x - iLine.o.x);
        a1 = ey - b1 * ex;
        a2 = iLine.o.y - b2 * iLine.o.x;

        xi = -(a1 - a2) / (b1 - b2);
        // yi = a1 + b1 * xi;
      }
      // 只需要计数 xi >= ex 的情况
      if (xi >= ex) {
        xcount += 1;
      }
      // 优化4：因为 fabric 中的多边形只需要用到矩形，所以根据矩形的特质，顶多只有两个交点，所以我们可以提前结束循环
      if (xcount === 2) {
        break;
      }
    }
    return xcount;
  }

  _pointerdown(e) {
    // console.log("_pointerdown");
    this.setoPointerdownPosition(e);
    let doingModel = this.__canvasModelList[this.canvasModel];
    doingModel.pointerdown(e, this);
  }
  _pointermove(e) {
    // console.log("_pointermove");
    let doingModel = this.__canvasModelList[this.canvasModel];
    doingModel.pointermove(e, this);
  }
  _pointerup() {
    // console.log("_pointerup");
  }

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
   * @description: 设置鼠标触发点位相对于canvas和屏幕的位置
   * @param {*} e
   * @return {*}
   */
  setoPointerdownPosition(e) {
    let pointer = Util.getPointer(e, this.upperCanvasEl);
    this._pointerDownOffsetWindowPoint = pointer;
    this._pointerDownOffsetCanvasPoint = {
      x: pointer.x - this._offset.left,
      y: pointer.y - this._offset.top,
    };
    return this;
  }
}

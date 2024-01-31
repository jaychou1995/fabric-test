import EventCenter from "../EventCenter";
import Util from "../utils";

export default class BaseObject extends EventCenter {
  type = "object"; //类型
  subType = ""; //次级类型
  graphical = "rect"; //图形默认正方形
  top = 0; //图形top,left和宽高
  left = 0;
  width = 0;
  height = 0;
  supportSelect = true; // 是否支持选中
  /** 是否处于激活态，也就是是否被选中 */
  active = false; //物体状态是否激活
  padding = 0; //物体选中状态和边框的距离
  visible = true; //是否可见
  scaleX = 1; //物体当前的缩放倍数 x
  scaleY = 1;
  angle = 0; //物体当前的旋转角度
  /** 左右镜像，比如反向拉伸控制点 */
  flipX = false;
  /** 上下镜像，比如反向拉伸控制点 */
  flipY = false;
  /** 旋转控制点偏移量 */
  rotatingPointOffset = 20;
  hasRotatingPoint = true; //物体是否有旋转控制
  fill = "pink"; // 默认图形颜色
  borderWidth = 1; //物体选中框的宽度
  borderColor = "#2099D4"; // 激活态边框颜色
  cornerColor = "#2099D4"; // 激活态控制点颜色
  /** 物体默认描边颜色 */
  stroke = "#000";

  constructor(options) {
    /** 计划设计类型
    const rect = new canvas.Object({
      top: 0,
      left: 0,
      width: 100,
      height: 100,
      fill: "#4169E1",
      graphical: 'rect'
    });
    */
    super();

    this.initialize(options);
  }

  /** 渲染物体，默认用 fill 填充 */
  render(ctx, noTransform = false) {
    if (this.width === 0 || this.height === 0 || !this.visible) return;

    ctx.save();

    if (!noTransform) {
      this.transform(ctx);
    }

    if (this.stroke) {
      ctx.lineWidth = this.strokeWidth;
      ctx.strokeStyle = this.stroke;
    }

    if (this.fill) {
      ctx.fillStyle = this.fill;
    }

    // 绘制物体
    this._render(ctx);

    // if (this.active && !noTransform) {
    //   // 绘制激活物体边框
    //   this.drawBorders(ctx);
    //   // 绘制激活物体四周的控制点
    //   this.drawControls(ctx);
    // }

    ctx.restore();
  }
  /** 绘制激活物体边框 */
  drawBorders(ctx) {}

  /** 由子类实现，就是由具体物体类来实现 */
  _render(ctx) {}

  /** 绘制前需要进行各种变换（包括平移、旋转、缩放）
   * 注意变换顺序很重要，顺序不一样会导致不一样的结果，所以一个框架一旦定下来了，后面大概率是不能更改的
   * 我们采用的顺序是：平移 -> 旋转 -> 缩放，这样可以减少些计算量，如果我们先旋转，点的坐标值一般就不是整数，那么后面的变换基于非整数来计算
   */
  transform(ctx) {
    let center = this.getCenterPoint();
    ctx.translate(center.x, center.y);
    ctx.rotate(Util.degreesToRadians(this.angle));
    ctx.scale(
      this.scaleX * (this.flipX ? -1 : 1),
      this.scaleY * (this.flipY ? -1 : 1)
    );
  }

  /**
   * @description: 初始化数据
   * @return {*}
   */
  initialize(options) {
    if (options) {
      for (let prop in options) {
        if (this[prop] === undefined || this[prop] === null) {
          console.log(this[prop]);
          return console.error("error, 属性不存在");
        }
        this[prop] = options[prop];
      }
    }
  }

  /** 获取当前大小，包含缩放效果 */
  getWidth() {
    return this.width * this.scaleX;
  }
  /** 获取当前大小，包含缩放效果 */
  getHeight() {
    return this.height * this.scaleY;
  }
  /** 设置物体激活状态 */
  setActive(active) {
    this.active = !!active;
    return this;
  }
}

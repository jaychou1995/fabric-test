import { EventCenter } from "../EventCenter";
import { Point } from "./point";
import { Util } from "../utils/index.js";

export class JObject extends EventCenter {
  type = "object"; //类型
  subType; //次级类型
  top = 0; //图形top,left和宽高
  left = 0;
  width = 0;
  height = 0;
  fill; //填充颜色

  supportSelect = true; // 是否支持选中
  /** 是否处于激活态，也就是是否被选中 */
  active = false; //物体状态是否激活
  padding = 0; //物体选中状态和边框的距离
  borderWidth = 1; //物体选中框的宽度
  borderColor = "#2099D4"; // 激活态边框颜色
  cornerColor = "#2099D4"; // 激活态控制点颜色
  strokeWidth = 1; //物体默认描边宽度
  stroke; //物体默认描边颜色，默认无

  scaleX = 1; //物体当前的缩放倍数 x
  scaleY = 1;
  angle = 0; //物体当前的旋转角度
  hasRotatingPoint = true; //物体是否有旋转控制
  cornerSize = 4; //物体控制点大小，单位 px

  // ltPoint; // 图形各个点位 左上右下中心等
  // rtPoint;
  // rbPoint;
  // lbPoint;
  centerPoint; // 中心点
  _pointList = {}; //点位合集
  /** 旋转控制点偏移量 */
  rotatingPointOffset = 20;

  constructor(options) {
    super();
    this.initialize(options);
    this.setPoint();
    this.setLine();
  }
  /**
   * @description: 初始化数据
   * @return {*}
   */
  initialize(options) {
    if (options) {
      for (let prop in options) {
        this[prop] = options[prop];
      }
    }
  }
  /**
   * @description: 渲染
   * @return {*}
   */
  render(ctx) {
    ctx.save();
    this.transform(ctx);

    // 绘制物体
    this._render(ctx);
    if (this.active) {
      // 如果是激活状态绘制边框

      // 绘制激活物体边框
      this.drawBorders(ctx);
      // 绘制激活物体四周的控制点
      this.drawControls(ctx);
    }

    ctx.restore();
  }

  /**
   * @description: 绘制前需要进行各种变换（包括平移、旋转、缩放）
   * * 注意变换顺序很重要，顺序不一样会导致不一样的结果，所以一个框架一旦定下来了，后面大概率是不能更改的
   * 我们采用的顺序是：平移 -> 旋转 -> 缩放，这样可以减少些计算量，如果我们先旋转，点的坐标值一般就不是整数，那么后面的变换基于非整数来计算
   * @return {*}
   */
  transform(ctx) {
    ctx.translate(this.centerPoint.x, this.centerPoint.y);
    ctx.rotate(Util.degreesToRadians(this.angle));
    ctx.scale(this.scaleX, this.scaleY);
  }

  /**
   * @description: 绘制激活物体边框
   * @return {*}
   */
  drawBorders(ctx) {
    let padding = this.padding,
      padding2 = padding * 2,
      strokeWidth = this.borderWidth;

    let w = this.getWidth(),
      h = this.getHeight();

    let rotateHeight = (-h - strokeWidth - padding * 2) / 2;
    this.rotateHeight = rotateHeight;

    ctx.save();

    ctx.strokeStyle = this.borderColor;
    ctx.lineWidth = strokeWidth;

    /** 画边框的时候需要把 transform 变换中的 scale 效果抵消，这样才能画出原始大小的线条 */
    ctx.scale(1 / this.scaleX, 1 / this.scaleY);

    // 画物体激活时候的边框，也就是包围盒
    ctx.strokeRect(
      -(w / 2) - padding - strokeWidth / 2,
      -(h / 2) - padding - strokeWidth / 2,
      w + padding2 + strokeWidth,
      h + padding2 + strokeWidth
    );

    if (this.hasRotatingPoint) {
      ctx.beginPath();
      ctx.moveTo(0, rotateHeight);
      ctx.lineTo(0, rotateHeight - this.rotatingPointOffset);
      ctx.closePath();
      ctx.stroke();
    }

    ctx.restore();
    return this;
  }

  /**
   * @description:绘制控制点
   * @param {*} ctx
   * @return {*}
   */
  drawControls(ctx) {
    let size = this.cornerSize,
      // strokeWidth2 = this.strokeWidth / 2,
      height = this.height,
      width = this.width;
    // left = -(this.width / 2),
    // top = -(this.height / 2);

    ctx.save();

    ctx.lineWidth = this.borderWidth / Math.max(this.scaleX, this.scaleY);
    ctx.strokeStyle = ctx.fillStyle = this.cornerColor;

    ctx.beginPath();
    ctx.arc(-width / 2, -height / 2, size, 0, 2 * Math.PI);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(width / 2, -height / 2, size, 0, 2 * Math.PI);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(width / 2, height / 2, size, 0, 2 * Math.PI);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(-width / 2, height / 2, size, 0, 2 * Math.PI);
    ctx.fill();

    if (this.hasRotatingPoint) {
      ctx.beginPath();
      ctx.arc(
        0,
        this.rotateHeight - this.rotatingPointOffset,
        size,
        0,
        2 * Math.PI
      );
      ctx.fill();
    }

    ctx.restore();

    return this;
  }
  //设置物体个点位
  setPoint() {
    let width = this.getWidth();
    let height = this.getHeight();
    this._pointList = {
      ltPoint: new Point(this.left, this.top),
      rtPoint: new Point(this.left + width, this.top),
      rbPoint: new Point(this.left + width, this.top + height),
      lbPoint: new Point(this.left, this.top + height),
      rotatePoint: new Point(
        this.left + width / 2,
        this.top - this.rotatingPointOffset
      ),
    };

    this.centerPoint = new Point(this.left + width / 2, this.top + height / 2);
  }
  //设置物体
  setLine() {
    let width = this.getWidth();
    let height = this.getHeight();
    this._lineList = {
      topline: {
        o: { x: this.left, y: this.top },
        d: { x: this.left + width, y: this.top },
      },
      rightline: {
        o: { x: this.left + width, y: this.top },
        d: { x: this.left + width, y: this.top + height },
      },
      bottomline: {
        o: { x: this.left + width, y: this.top + height },
        d: { x: this.left, y: this.top + height },
      },
      leftline: {
        o: { x: this.left, y: this.top + height },
        d: { x: this.left, y: this.top },
      },
    };
  }

  /** 获取当前大小，包含缩放效果 */
  getWidth() {
    return this.width * this.scaleX;
  }
  /** 获取当前大小，包含缩放效果 */
  getHeight() {
    return this.height * this.scaleY;
  }
  // 设置物体激活状态
  setActive(active) {
    this.active = !!active;
    return this;
  }
}

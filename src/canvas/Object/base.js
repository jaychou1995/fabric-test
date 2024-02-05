import EventCenter from "../EventCenter";
import Util from "../utils";
import Point from "./point";

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
  strokeWidth = 1; //物体选中框的宽度
  borderColor = "#2099D4"; // 激活态边框颜色
  cornerColor = "#2099D4"; // 激活态控制点颜色
  /** 物体默认描边颜色 */
  stroke = "#000";
  /** 物体包围盒的各个控制点的坐标 */
  coords = [];
  /** 物体控制点大小，单位 px */
  cornerSize = 4;
  /** 默认水平变换中心 left | right | center */
  originX = "center";
  /** 默认垂直变换中心 top | bottom | center */
  originY = "center";

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

    if (this.active && !noTransform) {
      // 绘制激活物体边框
      this.drawBorders(ctx);
      // 绘制激活物体四周的控制点
      this.drawControls(ctx);
    }

    ctx.restore();
  }
  /** 绘制激活物体边框 */
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
  /** 绘制激活物体四周的控制点 */
  drawControls(ctx) {
    let size = this.cornerSize,
      height = this.height,
      width = this.width;

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
  /** 设置问题移动位置 */
  set(key, value) {
    if (key === "scaleX" && value < 0) {
      this.flipX = !this.flipX;
      value *= -1;
    } else if (key === "scaleY" && value < 0) {
      this.flipY = !this.flipY;
      value *= -1;
    }
    this[key] = value;

    return this;
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

  /** 获取物体中心点 */
  getCenterPoint() {
    return this.translateToCenterPoint(
      new Point(this.left, this.top),
      this.originX,
      this.originY
    );
  }
  /** 将中心点移到变换基点 */
  translateToCenterPoint(point, originX, originY) {
    let cx = point.x,
      cy = point.y;

    if (originX === "left") {
      cx = point.x + this.getWidth() / 2;
    } else if (originX === "right") {
      cx = point.x - this.getWidth() / 2;
    }

    if (originY === "top") {
      cy = point.y + this.getHeight() / 2;
    } else if (originY === "bottom") {
      cy = point.y - this.getHeight() / 2;
    }
    const p = new Point(cx, cy);
    if (this.angle) {
      return Util.rotatePoint(p, point, Util.degreesToRadians(this.angle));
    } else {
      return p;
    }
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
  /** 检测哪个控制点被点击了 */
  _findTargetCorner(e, offset) {
    if (!this.hasControls || !this.active) return false;

    let pointer = Util.getPointer(e, this.canvas.upperCanvasEl),
      ex = pointer.x - offset.left,
      ey = pointer.y - offset.top,
      xpoints,
      lines;

    for (let i in this.oCoords) {
      if (i === "mtr" && !this.hasRotatingPoint) {
        continue;
      }

      lines = this._getImageLines(this.oCoords[i].corner);

      xpoints = this._findCrossPoints(ex, ey, lines);
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

  /** 重新设置物体包围盒的边框和各个控制点，包括位置和大小 */
  setCoords() {
    let strokeWidth = this.strokeWidth > 1 ? this.strokeWidth : 0,
      padding = this.padding,
      radian = Util.degreesToRadians(this.angle);

    this.currentWidth = (this.width + strokeWidth) * this.scaleX + padding * 2;
    this.currentHeight =
      (this.height + strokeWidth) * this.scaleY + padding * 2;
    console.log(22222, this.currentWidth, this.currentHeight);
    // 物体中心点到顶点的斜边长度
    let _hypotenuse = Math.sqrt(
      Math.pow(this.currentWidth / 2, 2) + Math.pow(this.currentHeight / 2, 2)
    );
    let _angle = Math.atan(this.currentHeight / this.currentWidth);

    // offset added for rotate and scale actions
    let offsetX = Math.cos(_angle + radian) * _hypotenuse,
      offsetY = Math.sin(_angle + radian) * _hypotenuse,
      sinTh = Math.sin(radian),
      cosTh = Math.cos(radian);

    let coords = this.getCenterPoint();
    let tl = {
      x: coords.x - offsetX,
      y: coords.y - offsetY,
    };
    let tr = {
      x: tl.x + this.currentWidth * cosTh,
      y: tl.y + this.currentWidth * sinTh,
    };
    let br = {
      x: tr.x - this.currentHeight * sinTh,
      y: tr.y + this.currentHeight * cosTh,
    };
    let bl = {
      x: tl.x - this.currentHeight * sinTh,
      y: tl.y + this.currentHeight * cosTh,
    };
    let ml = {
      x: tl.x - (this.currentHeight / 2) * sinTh,
      y: tl.y + (this.currentHeight / 2) * cosTh,
    };
    let mt = {
      x: tl.x + (this.currentWidth / 2) * cosTh,
      y: tl.y + (this.currentWidth / 2) * sinTh,
    };
    let mr = {
      x: tr.x - (this.currentHeight / 2) * sinTh,
      y: tr.y + (this.currentHeight / 2) * cosTh,
    };
    let mb = {
      x: bl.x + (this.currentWidth / 2) * cosTh,
      y: bl.y + (this.currentWidth / 2) * sinTh,
    };
    let mtr = {
      x: tl.x + (this.currentWidth / 2) * cosTh,
      y: tl.y + (this.currentWidth / 2) * sinTh,
    };

    // clockwise
    this.oCoords = { tl, tr, br, bl, ml, mt, mr, mb, mtr };

    // set coordinates of the draggable boxes in the corners used to scale/rotate the image
    this._setCornerCoords();

    return this;
  }
  /** 重新设置物体的每个控制点，包括位置和大小 */
  _setCornerCoords() {
    let coords = this.oCoords,
      radian = Util.degreesToRadians(this.angle),
      newTheta = Util.degreesToRadians(45 - this.angle),
      cornerHypotenuse = Math.sqrt(2 * Math.pow(this.cornerSize, 2)) / 2,
      cosHalfOffset = cornerHypotenuse * Math.cos(newTheta),
      sinHalfOffset = cornerHypotenuse * Math.sin(newTheta),
      sinTh = Math.sin(radian),
      cosTh = Math.cos(radian);

    coords.tl.corner = {
      tl: {
        x: coords.tl.x - sinHalfOffset,
        y: coords.tl.y - cosHalfOffset,
      },
      tr: {
        x: coords.tl.x + cosHalfOffset,
        y: coords.tl.y - sinHalfOffset,
      },
      bl: {
        x: coords.tl.x - cosHalfOffset,
        y: coords.tl.y + sinHalfOffset,
      },
      br: {
        x: coords.tl.x + sinHalfOffset,
        y: coords.tl.y + cosHalfOffset,
      },
    };

    coords.tr.corner = {
      tl: {
        x: coords.tr.x - sinHalfOffset,
        y: coords.tr.y - cosHalfOffset,
      },
      tr: {
        x: coords.tr.x + cosHalfOffset,
        y: coords.tr.y - sinHalfOffset,
      },
      br: {
        x: coords.tr.x + sinHalfOffset,
        y: coords.tr.y + cosHalfOffset,
      },
      bl: {
        x: coords.tr.x - cosHalfOffset,
        y: coords.tr.y + sinHalfOffset,
      },
    };

    coords.bl.corner = {
      tl: {
        x: coords.bl.x - sinHalfOffset,
        y: coords.bl.y - cosHalfOffset,
      },
      bl: {
        x: coords.bl.x - cosHalfOffset,
        y: coords.bl.y + sinHalfOffset,
      },
      br: {
        x: coords.bl.x + sinHalfOffset,
        y: coords.bl.y + cosHalfOffset,
      },
      tr: {
        x: coords.bl.x + cosHalfOffset,
        y: coords.bl.y - sinHalfOffset,
      },
    };

    coords.br.corner = {
      tr: {
        x: coords.br.x + cosHalfOffset,
        y: coords.br.y - sinHalfOffset,
      },
      bl: {
        x: coords.br.x - cosHalfOffset,
        y: coords.br.y + sinHalfOffset,
      },
      br: {
        x: coords.br.x + sinHalfOffset,
        y: coords.br.y + cosHalfOffset,
      },
      tl: {
        x: coords.br.x - sinHalfOffset,
        y: coords.br.y - cosHalfOffset,
      },
    };

    coords.ml.corner = {
      tl: {
        x: coords.ml.x - sinHalfOffset,
        y: coords.ml.y - cosHalfOffset,
      },
      tr: {
        x: coords.ml.x + cosHalfOffset,
        y: coords.ml.y - sinHalfOffset,
      },
      bl: {
        x: coords.ml.x - cosHalfOffset,
        y: coords.ml.y + sinHalfOffset,
      },
      br: {
        x: coords.ml.x + sinHalfOffset,
        y: coords.ml.y + cosHalfOffset,
      },
    };

    coords.mt.corner = {
      tl: {
        x: coords.mt.x - sinHalfOffset,
        y: coords.mt.y - cosHalfOffset,
      },
      tr: {
        x: coords.mt.x + cosHalfOffset,
        y: coords.mt.y - sinHalfOffset,
      },
      bl: {
        x: coords.mt.x - cosHalfOffset,
        y: coords.mt.y + sinHalfOffset,
      },
      br: {
        x: coords.mt.x + sinHalfOffset,
        y: coords.mt.y + cosHalfOffset,
      },
    };

    coords.mr.corner = {
      tl: {
        x: coords.mr.x - sinHalfOffset,
        y: coords.mr.y - cosHalfOffset,
      },
      tr: {
        x: coords.mr.x + cosHalfOffset,
        y: coords.mr.y - sinHalfOffset,
      },
      bl: {
        x: coords.mr.x - cosHalfOffset,
        y: coords.mr.y + sinHalfOffset,
      },
      br: {
        x: coords.mr.x + sinHalfOffset,
        y: coords.mr.y + cosHalfOffset,
      },
    };

    coords.mb.corner = {
      tl: {
        x: coords.mb.x - sinHalfOffset,
        y: coords.mb.y - cosHalfOffset,
      },
      tr: {
        x: coords.mb.x + cosHalfOffset,
        y: coords.mb.y - sinHalfOffset,
      },
      bl: {
        x: coords.mb.x - cosHalfOffset,
        y: coords.mb.y + sinHalfOffset,
      },
      br: {
        x: coords.mb.x + sinHalfOffset,
        y: coords.mb.y + cosHalfOffset,
      },
    };

    coords.mtr.corner = {
      tl: {
        x: coords.mtr.x - sinHalfOffset + sinTh * this.rotatingPointOffset,
        y: coords.mtr.y - cosHalfOffset - cosTh * this.rotatingPointOffset,
      },
      tr: {
        x: coords.mtr.x + cosHalfOffset + sinTh * this.rotatingPointOffset,
        y: coords.mtr.y - sinHalfOffset - cosTh * this.rotatingPointOffset,
      },
      bl: {
        x: coords.mtr.x - cosHalfOffset + sinTh * this.rotatingPointOffset,
        y: coords.mtr.y + sinHalfOffset - cosTh * this.rotatingPointOffset,
      },
      br: {
        x: coords.mtr.x + sinHalfOffset + sinTh * this.rotatingPointOffset,
        y: coords.mtr.y + cosHalfOffset - cosTh * this.rotatingPointOffset,
      },
    };
  }
}

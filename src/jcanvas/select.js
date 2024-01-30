import { Util } from "./utils/index.js";

export class SelectModel {
  model = "select";
  canvas = null;
  pointerdown(e, canvas) {
    let isLeftClick = e.button === 0; //是否是鼠标左键点击
    if (!isLeftClick) return;

    this.canvas = canvas;

    let target = this.findTarget(e); //判断是否点击到物体

    let isNeedRender = true; // 默认点击需要重新渲染
    if (!target && this.canvas._activeObject === null) {
      // 如果没有点到物体且当前没有激活的图形,就不重新渲染
      isNeedRender = false;
    }

    // 先清空所有图形激活状态
    this.canvas.clearAllObjectActive();

    if (target) this.canvas.setActiveObject(target); //设置为激活状态

    this.canvas._setupCurrentTransform(e, target); //设置_currentTransform

    if (isNeedRender) {
      // 如果没有点到物体且当前没有激活的图形,就不重新渲染
      this.canvas.renderAll();
    }
  }

  pointermove(e, canvas) {
    // console.log(this._currentTransform);
    // if(this.nowTargetObject){
    //   console.log(e, canvas);
    // }
  }

  /**
   * @description: 查找是否有物体在点击事件上
   * @param {*} e
   * @return {*}
   */
  findTarget(e) {
    console.log(2323);
    let target;
    // 遍历所有物体，判断鼠标点是否在物体包围盒内
    for (let i = this.canvas._objects.length; i--; ) {
      if (
        this.canvas._objects[i] &&
        this.containsPoint(e, this.canvas._objects[i])
      ) {
        target = this.canvas._objects[i];
        break;
      }
    }

    if (target) return target;
  }
  /**
   * @description: 判断是否点击到物体具体算法
   * @param {*} e
   * @param {*} object
   * @return {*}
   */
  containsPoint(e, object) {
    let xpoints = this._findCrossPoints(
      this.canvas._pointerDownOffsetCanvasPoint.x,
      this.canvas._pointerDownOffsetCanvasPoint.y,
      object._lineList
    );

    if (xpoints && xpoints % 2 === 1) {
      return true;
    }
    return false;
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
}

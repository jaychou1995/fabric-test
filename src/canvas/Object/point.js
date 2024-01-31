/**
 * @description: 控制点
 * @return {*}
 */
export default class Point {
  x = 0; //点位
  y = 0;
  /** 点可控制周围区域 */
  corner = {};
  /** 可点击范围 */
  size = 4;
  constructor(x, y) {
    this.x = x;
    this.y = y;
    // this.setCorner(x, y);
  }
  setCorner(x, y) {
    this.corner = {
      bl: { x: x - this.size, y: y + this.size },
      br: { x: x + this.size, y: y + this.size },
      tl: { x: x - this.size, y: y - this.size },
      tr: { x: x + this.size, y: y - this.size },
    };
    //     bl: {x: 94, y: 106}
    // br: {x: 106, y: 106}
    // tl: {x: 94, y: 94}
    // tr: {x: 106, y: 94}
  }
  min(otherPoint) {
    return new Point(
      Math.min(this.x, otherPoint.x),
      Math.min(this.y, otherPoint.y)
    );
  }
  max(otherPoint) {
    return new Point(
      Math.max(this.x, otherPoint.x),
      Math.max(this.y, otherPoint.y)
    );
  }
  /** += 的意思，会改变自身的值 */
  addEquals(point) {
    this.x += point.x;
    this.y += point.y;
    return this;
  }
  /** -= 的意思，会改变自身的值 */
  subtractEquals(point) {
    this.x -= point.x;
    this.y -= point.y;
    return this;
  }
}

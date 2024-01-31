/**
 * @description: 控制点
 * @return {*}
 */
export default class Point {
  x = 0; //点位
  y = 0;
  constructor(x, y) {
    this.x = x;
    this.y = y;
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

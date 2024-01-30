import { JObject } from "./JObject";

export class Rect extends JObject {
  type = "rect";
  rx = 0;
  ry = 0;
  constructor(options) {
    super(options);
    this._initRxRy(options);
  }
  /** 初始化圆角 */
  _initRxRy(options) {
    this.rx = options.rx || 0;
    this.ry = options.ry || 0;
    /** 如果 rx 或者 ry 只传了一个，默认二者相等 */
    if (this.rx && !this.ry) {
      this.ry = this.rx;
    } else if (this.ry && !this.rx) {
      this.rx = this.ry;
    }
  }
  _render(ctx) {
    let rx = this.rx || 0,
      ry = this.ry || 0,
      x = -this.width / 2,
      y = -this.height / 2,
      w = this.width,
      h = this.height;

    ctx.beginPath();

    ctx.moveTo(x + rx, y);
    ctx.lineTo(x + w - rx, y);
    ctx.bezierCurveTo(x + w, y, x + w, y + ry, x + w, y + ry);
    ctx.lineTo(x + w, y + h - ry);
    ctx.bezierCurveTo(x + w, y + h, x + w - rx, y + h, x + w - rx, y + h);
    ctx.lineTo(x + rx, y + h);
    ctx.bezierCurveTo(x, y + h, x, y + h - ry, x, y + h - ry);
    ctx.lineTo(x, y + ry);
    ctx.bezierCurveTo(x, y, x + rx, y, x + rx, y);
    ctx.closePath();

    if (this.fill) {
      ctx.fillStyle = this.fill;
      ctx.fill();
    }

    if (this.stroke) {
      ctx.lineWidth = this.strokeWidth;
      ctx.strokeStyle = this.stroke;
      ctx.stroke();
    }
  }
}

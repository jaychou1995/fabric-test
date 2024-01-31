import BaseObject from "./base";

export default class canvasObject extends BaseObject {
  constructor(options) {
    super(options);
  }

  _render(ctx) {
    ctx.save();

    ctx.rect(this.left, this.top, this.width, this.height);

    if (this.fill) ctx.fill();

    if (this.stroke) ctx.stroke();

    ctx.restore();
  }
}

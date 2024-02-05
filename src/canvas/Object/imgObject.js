import BaseObject from "./base";
import Util from "../utils";

export default class imgObject extends BaseObject {
  type = "img";
  _element;
  constructor(element, options) {
    super(options);
    this._initElement(element, options);
  }

  _initElement(element, options) {
    this._element = element;
    this.setOptions(options);
    this._setWidthHeight(options);
  }
  setOptions(options) {
    for (let prop in options) {
      this[prop] = options[prop];
    }
  }
  /** 设置图像大小 */
  _setWidthHeight(options) {
    this.width =
      "width" in options
        ? options.width
        : this.getElement()
        ? this.getElement().width || 0
        : 0;
    this.height =
      "height" in options
        ? options.height
        : this.getElement()
        ? this.getElement().height || 0
        : 0;
  }
  /** 直接调用 drawImage 绘制图像 */
  _render(ctx, noTransform = false) {
    let x, y, elementToDraw;

    x = noTransform ? this.left : -this.width / 2;
    y = noTransform ? this.top : -this.height / 2;

    elementToDraw = this._element;
    elementToDraw &&
      ctx.drawImage(elementToDraw, x, y, this.width, this.height);
  }

  /** 如果是根据 url 或者本地路径加载图像，本质都是取加载图片完成之后在转成 img 标签 */
  static fromURL(url, callback, imgOptions) {
    Util.loadImage(url).then((img) => {
      callback && callback(new imgObject(img, imgOptions));
    });
  }
}

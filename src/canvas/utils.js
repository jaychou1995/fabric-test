const PiBy180 = Math.PI / 180; // 角度转弧度使用 写在这里相当于缓存，因为会频繁调用

export default class Util {
  /**
   * @description: 给元素添加类名
   * @param {*} element
   * @param {*} className
   * @return {*}
   */
  static addClass(element, className) {
    if ((" " + element.className + " ").indexOf(" " + className + " ") === -1) {
      element.className += (element.className ? " " : "") + className;
    }
  }
  /**
   * @description: 给元素设置样式
   * @param {*} element
   * @param {*} styles
   * @return {*}
   */
  static setStyle(element, styles) {
    let elementStyle = element.style;

    if (typeof styles === "string") {
      element.style.cssText += ";" + styles;
      return styles.indexOf("opacity") > -1
        ? Util.setOpacity(element, styles.match(/opacity:\s*(\d?\.?\d*)/)[1])
        : element;
    }
    for (let property in styles) {
      if (property === "opacity") {
        Util.setOpacity(element, styles[property]);
      } else {
        elementStyle[property] = styles[property];
      }
    }
    return element;
  }
  /** 加载图片,转成img标签 */
  static loadImage(url, options = {}) {
    return new Promise(function (resolve, reject) {
      let img = document.createElement("img");
      let done = () => {
        img.onload = img.onerror = null;
        resolve(img);
      };
      if (url) {
        img.onload = done;
        img.onerror = () => {
          reject(new Error("Error loading " + img.src));
        };
        options &&
          options.crossOrigin &&
          (img.crossOrigin = options.crossOrigin);
        img.src = url;
      } else {
        done();
      }
    });
  }

  /** 角度转弧度，注意 canvas 中用的都是弧度，但是角度对我们来说比较直观 */
  static degreesToRadians(degrees) {
    return degrees * PiBy180;
  }
  /** 弧度转角度，注意 canvas 中用的都是弧度，但是角度对我们来说比较直观 */
  static radiansToDegrees(radians) {
    return radians / PiBy180;
  }
  static pointerX(event) {
    return event.clientX || 0;
  }
  static pointerY(event) {
    return event.clientY || 0;
  }
  /** 获取元素位置 */
  static getElementPosition(element) {
    return window.getComputedStyle(element, null).position;
  }
  /** 获取鼠标的点击坐标，相对于页面左上角，注意不是画布的左上角，到时候会减掉 offset */
  static getPointer(event, upperCanvasEl) {
    let element = event.target,
      body = document.body || { scrollLeft: 0, scrollTop: 0 },
      docElement = document.documentElement,
      orgElement = element,
      scrollLeft = 0,
      scrollTop = 0,
      firstFixedAncestor;

    while (element && element.parentNode && !firstFixedAncestor) {
      element = element.parentNode;
      if (element !== document && Util.getElementPosition(element) === "fixed")
        firstFixedAncestor = element;

      if (
        element !== document &&
        orgElement !== upperCanvasEl &&
        Util.getElementPosition(element) === "absolute"
      ) {
        scrollLeft = 0;
        scrollTop = 0;
      } else if (element === document && orgElement !== upperCanvasEl) {
        scrollLeft = body.scrollLeft || docElement.scrollLeft || 0;
        scrollTop = body.scrollTop || docElement.scrollTop || 0;
      } else {
        scrollLeft += element.scrollLeft || 0;
        scrollTop += element.scrollTop || 0;
      }
    }

    return {
      x: Util.pointerX(event) + scrollLeft,
      y: Util.pointerY(event) + scrollTop,
    };
  }

  /** 计算元素偏移值 距离屏幕位置offset */
  static getElementOffset(element) {
    let valueT = 0,
      valueL = 0;
    do {
      valueT += element.offsetTop || 0;
      valueL += element.offsetLeft || 0;
      element = element.offsetParent;
    } while (element);
    return { left: valueL, top: valueT };
  }
}

import Util from "./utils";

export default class SelectModel {
  constructor() {
    this.model = "select";
  }
  _pointerdown(e, canvas) {
    let isLeftClick = e.button === 0; //是否是鼠标左键点击
    if (!isLeftClick) return;

    // 这个我猜是为了保险起见，ignore if some object is being transformed at this moment
    if (canvas._currentTransform) return;

    let target = canvas.findTarget(e);

    if (target) {
      // 如果是选中单个物体
      canvas.deactivateAll();
      canvas.setActiveObject(target);

      canvas._setupCurrentTransform(e, target);

      canvas.renderAll();
    }

    return target;
  }
  _pointermove(e, canvas) {
    let target, pointer;

    // let groupSelector = this._groupSelector;

    pointer = Util.getPointer(e, canvas.upperCanvasEl);
    let x = pointer.x,
      y = pointer.y;

    if (canvas._currentTransform) {
      canvas._currentTransform.target.isMoving = true;
      let t = canvas._currentTransform,
        reset = false;

      // 如果是拖拽物体
      this._translateObject(x, y, canvas);

      canvas.emit("object:moving", {
        target: canvas._currentTransform.target,
        e,
      });

      canvas._currentTransform.target.emit("moving", { e });

      canvas.renderAll();
    }
  }

  _pointerup(e, canvas) {
    let target;
    if (canvas._currentTransform) {
      let transform = canvas._currentTransform;

      target = transform.target;
      if (target._scaling) {
        target._scaling = false;
      }

      // 每次物体更改都要重新计算新的控制点
      let i = canvas._objects.length;
      while (i--) {
        canvas._objects[i].setCoords();
      }

      target.isMoving = false;

      // 在点击之间如果物体状态改变了才派发事件
      // if (target.hasStateChanged()) {
      //   this.emit("object:modified", { target });
      //   target.emit("modified");
      // }
    }

    canvas._currentTransform = null;
  }

  _translateObject(x, y, canvas) {
    let target = canvas._currentTransform.target;
    target.set("left", x - canvas._currentTransform.offsetX);
    target.set("top", y - canvas._currentTransform.offsetY);
  }
}

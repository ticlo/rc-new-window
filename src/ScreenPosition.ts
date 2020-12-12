export function estimateBrowserZoom(_window: Window): number {
  // one of them might be off by a lot due to developer console or other browser plugin
  let xRatio = (_window.outerWidth - 8) / _window.innerWidth;
  let yRatio = (_window.outerHeight - 85) / _window.innerHeight;

  let zoomRatio = Math.min(yRatio, xRatio);
  if (zoomRatio > 1.8) {
    zoomRatio = Math.round(zoomRatio);
  } else if (zoomRatio > 0.73) {
    zoomRatio = Math.round(zoomRatio * 20) / 20;
  } else {
    zoomRatio = 2 / Math.round(2 / zoomRatio);
  }
  return zoomRatio;
}

export function estimateWindowBorder(
  _window: Window,
  addBorder: boolean = false,
): [number, number, number] {
  let zoom = estimateBrowserZoom(_window);
  let xBorder = (_window.outerWidth - _window.innerWidth * zoom) >> 1;
  let yBorder = Math.round(_window.outerHeight - _window.innerHeight * zoom);
  if (xBorder > 32) {
    // probably because of debugger console, assume it's in the right side, so left side border is 8
    xBorder = 8;
  } else if (xBorder <= 4 && addBorder) {
    xBorder = 8;
    yBorder += 8;
  } else {
    yBorder -= xBorder;
  }
  return [xBorder, yBorder, zoom];
}

interface Pt {
  x: number;
  y: number;
}

export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export class MapRect2D {
  scaleX: number;
  scaleY: number;
  offsetX: number;
  offsetY: number;

  init(
    x1: number,
    y1: number,
    w1: number,
    h1: number,
    x2: number,
    y2: number,
    w2: number,
    h2: number,
  ) {
    this.scaleX = w2 / w1;
    this.scaleY = h2 / h1;
    this.offsetX = x2 - x1 * this.scaleX;
    this.offsetY = y2 - y1 * this.scaleY;
  }

  map(pt: Pt): Pt {
    return { x: pt.x * this.scaleX + this.offsetX, y: pt.y * this.scaleY + this.offsetY };
  }

  revertMap(pt: Pt): Pt {
    return { x: (pt.x - this.offsetX) / this.scaleX, y: (pt.y - this.offsetY) / this.scaleY };
  }
}

export function mapElementToScreenRect(
  element: HTMLElement,
  rect?: Rect,
  addBorder: boolean = true,
): Rect {
  if (!element) {
    return null;
  }
  let clientRect = element.getBoundingClientRect();
  let mapRect = new MapRect2D();
  mapRect.init(
    element.offsetLeft,
    element.offsetTop,
    element.offsetWidth,
    element.offsetHeight,
    clientRect.x,
    clientRect.y,
    clientRect.width,
    clientRect.height,
  );
  let mappedRect: Rect;
  if (rect) {
    let { x, y } = mapRect.map({ x: rect.left, y: rect.top });
    let { x: x2, y: y2 } = mapRect.map({ x: rect.left + rect.width, y: rect.top + rect.height });
    mappedRect = { left: x, top: y, width: x2 - x, height: y2 - y };
  } else {
    mappedRect = {
      left: clientRect.left,
      top: clientRect.top,
      width: clientRect.width,
      height: clientRect.height,
    };
  }
  let _document = element.ownerDocument;
  let _window = _document.defaultView;
  if (!_window) {
    return clientRect;
  }
  // recursively get rect if it's an iframe
  if (_window.frameElement) {
    return mapElementToScreenRect(_window.frameElement as HTMLElement, mappedRect, addBorder);
  }
  let [xBorder, yBorder, zoom] = estimateWindowBorder(_window, false);
  if (zoom !== 1) {
    mappedRect.left *= zoom;
    mappedRect.top *= zoom;
    mappedRect.width *= zoom;
    mappedRect.height *= zoom;
  }

  mappedRect.left += _window.screenX + xBorder;
  mappedRect.top += _window.screenY + yBorder;
  if (addBorder) {
    mappedRect.left -= 8;
    mappedRect.top -= 60;
  }
  return mappedRect;
}

import { Point, ViewBox } from '../interfaces';

export function calculateViewBoxFromBBox(
  bbox: DOMRect,
  paddingFactor = 0
): ViewBox {
  const padding = Math.max(bbox.width, bbox.height) * paddingFactor;
  return {
    x: bbox.x - padding / 2,
    y: bbox.y - padding / 2,
    width: bbox.width + padding,
    height: bbox.height + padding
  };
}

export function clientPointToSvgPoint(
  clientPoint: Point,
  svg: SVGSVGElement
): Point {
  const point = svg.createSVGPoint();
  point.x = clientPoint.x;
  point.y = clientPoint.y;
  return point.matrixTransform(svg.getScreenCTM()?.inverse());
}

export function constrain(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(value, min));
}

export function getDistanceBetweenPoints(pointA: Point, pointB: Point): number {
  return Math.sqrt(
    Math.pow(pointA.y - pointB.y, 2) + Math.pow(pointA.x - pointB.x, 2)
  );
}

export function getMidpoint(pointA: Point, pointB: Point): Point {
  return {
    x: (pointA.x + pointB.x) / 2,
    y: (pointA.y + pointB.y) / 2
  };
}

export function getPointFromEvent(e: React.MouseEvent | React.Touch): Point {
  return {
    x: e.clientX,
    y: e.clientY
  };
}

export function getViewBoxString(vb?: ViewBox) {
  return vb ? `${vb.x} ${vb.y} ${vb.width} ${vb.height}` : undefined;
}

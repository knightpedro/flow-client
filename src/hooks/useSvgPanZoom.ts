import { useEffect, useState } from 'react';

const DOUBLE_CLICK_THRESHOLD = 300;
const INITIAL_VIEWBOX: ViewBox = {
  x: 0,
  y: 0,
  width: 100,
  height: 100
};
const PADDING_FACTOR = 0.05;
const LEFT_CLICK = 0;
const MIDDLE_CLICK = 1;
const ZOOM_MIN = 1;
const ZOOM_MAX = 10;
const ZOOM_STEP = 2;

interface Point {
  x: number;
  y: number;
}

interface ViewBox extends Point {
  height: number;
  width: number;
}

interface PanZoom {
  handleMouseDown: React.MouseEventHandler;
  handleMouseLeave: React.MouseEventHandler;
  handleMouseMove: React.MouseEventHandler;
  handleMouseUp: React.MouseEventHandler;
  handleTouchStart: React.TouchEventHandler;
  handleTouchMove: React.TouchEventHandler;
  handleTouchEnd: React.TouchEventHandler;
  handleWheel: React.WheelEventHandler;
  viewBox?: string;
}

function calculateViewBoxFromBBox(bbox: DOMRect): ViewBox {
  const padding = Math.max(bbox.width, bbox.height) * PADDING_FACTOR;
  return {
    x: bbox.x - padding / 2,
    y: bbox.y - padding / 2,
    width: bbox.width + padding,
    height: bbox.height + padding
  };
}

function clientPointToSvgPoint(clientPoint: Point, svg: SVGSVGElement): Point {
  const point = svg.createSVGPoint();
  point.x = clientPoint.x;
  point.y = clientPoint.y;
  return point.matrixTransform(svg.getScreenCTM()?.inverse());
}

function constrain(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(value, min));
}

function getDistanceBetweenPoints(pointA: Point, pointB: Point): number {
  return Math.sqrt(
    Math.pow(pointA.y - pointB.y, 2) + Math.pow(pointA.x - pointB.x, 2)
  );
}

function getMidpoint(pointA: Point, pointB: Point): Point {
  return {
    x: (pointA.x + pointB.x) / 2,
    y: (pointA.y + pointB.y) / 2
  };
}

function getPointFromEvent(e: React.MouseEvent | React.Touch): Point {
  return {
    x: e.clientX,
    y: e.clientY
  };
}

function getViewBoxString(vb?: ViewBox) {
  return vb ? `${vb.x} ${vb.y} ${vb.width} ${vb.height}` : undefined;
}

export default function useSvgPanZoom(
  svgRef: React.RefObject<SVGSVGElement>
): PanZoom {
  const [initialViewBox, setInitialViewBox] = useState(INITIAL_VIEWBOX);
  const [viewBox, setViewBox] = useState(INITIAL_VIEWBOX);
  const [lastPinchDistance, setLastPinchDistance] = useState(0);
  const [lastPointer, setLastPointer] = useState<Point>({ x: 0, y: 0 });
  const [lastMiddleClick, setLastMiddleClick] = useState<number>();
  const [lastTouchEnd, setLastTouchEnd] = useState(0);
  const [panning, setPanning] = useState(false);
  const [zoom, setZoom] = useState(ZOOM_MIN);

  useEffect(() => {
    if (svgRef.current) {
      const bbox = svgRef.current.getBBox();
      const calculatedViewBox = calculateViewBoxFromBBox(bbox);
      setInitialViewBox(calculatedViewBox);
      setViewBox(calculatedViewBox);
    }
  }, [svgRef]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault(); // stops text selection
    if (e.button === LEFT_CLICK) {
      setPanning(true);
      setLastPointer(getPointFromEvent(e));
    }
  };

  const handleMouseLeave = (e: React.MouseEvent) => {
    setPanning(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    e.preventDefault();
    const newPointer = getPointFromEvent(e);
    handlePan(newPointer);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    setPanning(false);
    if (e.button === MIDDLE_CLICK) {
      if (
        lastMiddleClick &&
        lastMiddleClick + DOUBLE_CLICK_THRESHOLD > e.timeStamp
      )
        reset();
      setLastMiddleClick(e.timeStamp);
    }
  };

  const handlePan = (newPointer: Point) => {
    if (panning && svgRef.current) {
      const bbox = svgRef.current.getBoundingClientRect();
      setViewBox((prev) => ({
        x:
          prev.x - ((newPointer.x - lastPointer.x) * prev.height) / bbox.height,
        y:
          prev.y - ((newPointer.y - lastPointer.y) * prev.height) / bbox.height,
        width: prev.width,
        height: prev.height
      }));
      setLastPointer(newPointer);
    }
  };

  const handlePinchStart = (e: React.TouchEvent) => {
    const pointA = getPointFromEvent(e.touches[0]);
    const pointB = getPointFromEvent(e.touches[1]);
    setLastPinchDistance(getDistanceBetweenPoints(pointA, pointB));
  };

  const handlePinchMove = (e: React.TouchEvent) => {
    const pointA = getPointFromEvent(e.touches[0]);
    const pointB = getPointFromEvent(e.touches[1]);
    const distance = getDistanceBetweenPoints(pointA, pointB);
    const midpoint = getMidpoint(pointA, pointB);

    if (lastPinchDistance) {
      const newZoom = constrain(
        (zoom * distance) / lastPinchDistance,
        ZOOM_MIN,
        ZOOM_MAX
      );
      handleZoom(newZoom, midpoint);
    }

    setLastPinchDistance(distance);
  };

  const handleTapStart = (e: React.TouchEvent) => {
    setPanning(true);
    setLastPointer(getPointFromEvent(e.touches[0]));
  };

  const handleTapMove = (e: React.TouchEvent) => {
    const newPointer = getPointFromEvent(e.touches[0]);
    handlePan(newPointer);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) handleTapStart(e);
    else if (e.touches.length === 2) handlePinchStart(e);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) handleTapMove(e);
    else if (e.touches.length === 2) handlePinchMove(e);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setPanning(false);
    if (e.touches.length > 0) return;
    if (lastTouchEnd && lastTouchEnd + DOUBLE_CLICK_THRESHOLD > e.timeStamp)
      reset();
    setLastTouchEnd(e.timeStamp);
  };

  const handleWheel = (e: React.WheelEvent) => {
    const centre = getPointFromEvent(e);
    const newZoom = e.deltaY < 0 ? zoom + 1 : zoom - 1;
    handleZoom(newZoom, centre);
  };

  const handleZoom = (newZoom: number, centre: Point) => {
    if (newZoom < ZOOM_MIN || newZoom > ZOOM_MAX || !svgRef.current) return;
    const zoomAt = clientPointToSvgPoint(centre, svgRef.current);
    const scale = Math.pow(ZOOM_STEP, newZoom - 1);
    const width = initialViewBox.width / scale;
    const height = initialViewBox.height / scale;
    setViewBox((prev) => ({
      x: prev.x - ((zoomAt.x - prev.x) / prev.width) * (width - prev.width),
      y: prev.y - ((zoomAt.y - prev.y) / prev.height) * (height - prev.height),
      width,
      height
    }));
    setZoom(newZoom);
  };

  const reset = () => {
    setViewBox(initialViewBox);
  };

  return {
    handleMouseDown,
    handleMouseLeave,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleWheel,
    viewBox: getViewBoxString(viewBox)
  };
}

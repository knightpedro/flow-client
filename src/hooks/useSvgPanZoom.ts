import { useEffect, useState } from 'react';
import { Point, ViewBox } from '../interfaces';
import {
  calculateViewBoxFromBBox,
  clientPointToSvgPoint,
  constrain,
  getDistanceBetweenPoints,
  getMidpoint,
  getPointFromEvent,
  getViewBoxString
} from '../utils';

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

export interface PanZoom {
  handleMouseDown: React.MouseEventHandler;
  handleMouseLeave: React.MouseEventHandler;
  handleMouseMove: React.MouseEventHandler;
  handleMouseUp: React.MouseEventHandler;
  handleTouchStart: React.TouchEventHandler;
  handleTouchMove: React.TouchEventHandler;
  handleTouchEnd: React.TouchEventHandler;
  handleWheel: React.WheelEventHandler;
  panTo: (point: Point) => void;
  viewBox?: string;
}

export interface PanZoomOptions {
  panDisabled?: boolean;
  zoomDisabled?: boolean;
  zoomMax?: number;
  zoomMin?: number;
}

export function useSvgPanZoom(
  svgRef: React.RefObject<SVGSVGElement>,
  {
    panDisabled = false,
    zoomDisabled = false,
    zoomMax = ZOOM_MAX,
    zoomMin = ZOOM_MIN
  }: PanZoomOptions
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
      const calculatedViewBox = calculateViewBoxFromBBox(bbox, PADDING_FACTOR);
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
    if (panning && !panDisabled && svgRef.current) {
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
        zoomMin,
        zoomMax
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
    if (
      newZoom < zoomMin ||
      newZoom > zoomMax ||
      !svgRef.current ||
      zoomDisabled
    )
      return;
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

  const panTo = (point: Point) => {
    setViewBox((prev) => ({
      x: point.x - prev.width / 2,
      y: point.y - prev.height / 2,
      width: prev.width,
      height: prev.height
    }));
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
    panTo,
    viewBox: getViewBoxString(viewBox)
  };
}

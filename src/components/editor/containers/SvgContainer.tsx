import React, { useState, useRef, useEffect, useMemo } from 'react';
import { gsap } from 'gsap';

const DOUBLE_CLICK_THRESHOLD = 300;
const INITIAL_VIEWBOX = {
  x: 0,
  y: 0,
  width: 1024,
  height: 1024
};
const MIN_ZOOM = 1;
const VIEWBOX_EASE = 'power1.out';
const VIEWBOX_ANIMATION_DURATION = 0.2;

interface ContainerProps {
  maxZoom?: number;
}

interface Point {
  x: number;
  y: number;
}

interface ViewBox extends Point {
  width: number;
  height: number;
}

function constrain(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(value, min));
}

function getClientPointFromEvent(event: React.MouseEvent | React.Touch): Point {
  return { x: event.clientX, y: event.clientY };
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

function getViewBoxString(viewBox: ViewBox): string {
  const { x, y, width, height } = viewBox;
  const viewBoxValues = [x, y, height, width];
  return viewBoxValues
    .map((v) => Math.round((v + Number.EPSILON) * 10) / 10)
    .join(' ');
}

function SvgContainer({ maxZoom = 10 }: ContainerProps) {
  const [viewBox, setViewBox] = useState<ViewBox>(INITIAL_VIEWBOX);
  const [panning, setPanning] = useState(false);
  const [pointer, setPointer] = useState<Point>();
  const [zoom, setZoom] = useState(1);
  const svgRef = useRef<SVGSVGElement>(null);
  const [lastPinchDistance, setLastPinchDistance] = useState<number>();
  const [lastTouchEnd, setLastTouchEnd] = useState<number>();
  const [lastMiddleClick, setLastMiddleClick] = useState<number>();

  const viewBoxString = useMemo(() => {
    return getViewBoxString(viewBox);
  }, [viewBox]);

  useEffect(() => {
    gsap.to(svgRef.current, {
      attr: { viewBox: viewBoxString },
      duration: VIEWBOX_ANIMATION_DURATION,
      ease: VIEWBOX_EASE
    });
  }, [viewBoxString]);

  useEffect(() => {
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, []);

  function handleMouseDown(event: React.MouseEvent): void {
    if (event.button === 0) {
      setPanning(true);
      setPointer(getClientPointFromEvent(event));
    }
  }

  function handleMouseUp(event: React.MouseEvent): void {
    if (event.button === 1) {
      if (
        lastMiddleClick &&
        lastMiddleClick + DOUBLE_CLICK_THRESHOLD > event.timeStamp
      )
        reset();
      setLastMiddleClick(event.timeStamp);
    }
  }

  function handleWindowMouseUp(): void {
    setPanning(false);
  }

  function handleMouseMove(event: React.MouseEvent): void {
    const newPointer = getClientPointFromEvent(event);
    handlePan(newPointer);
  }

  function handlePan(newPointer: Point) {
    if (panning && pointer && svgRef.current) {
      const viewBoxRatio =
        viewBox.width / svgRef.current.getBoundingClientRect().width;
      const x = viewBox.x - (newPointer.x - pointer.x) * viewBoxRatio;
      const y = viewBox.y - (newPointer.y - pointer.y) * viewBoxRatio;
      setViewBox({
        x,
        y,
        width: viewBox.width,
        height: viewBox.height
      });
      setPointer(newPointer);
    }
  }

  function handlePinchStart(event: React.TouchEvent) {
    const pointA = getClientPointFromEvent(event.touches[0]);
    const pointB = getClientPointFromEvent(event.touches[1]);
    setLastPinchDistance(getDistanceBetweenPoints(pointA, pointB));
  }

  function handlePinchMove(event: React.TouchEvent) {
    const pointA = getClientPointFromEvent(event.touches[0]);
    const pointB = getClientPointFromEvent(event.touches[1]);
    const distance = getDistanceBetweenPoints(pointA, pointB);
    const midpoint = getMidpoint(pointA, pointB);

    if (lastPinchDistance) {
      const newZoom = constrain(
        (zoom * distance) / lastPinchDistance,
        MIN_ZOOM,
        maxZoom
      );
      handleZoom(newZoom, midpoint);
    }

    setLastPinchDistance(distance);
  }

  function handleTapStart(event: React.TouchEvent) {
    setPanning(true);
    setPointer(getClientPointFromEvent(event.touches[0]));
  }

  function handleTapMove(event: React.TouchEvent) {
    const newPointer = getClientPointFromEvent(event.touches[0]);
    handlePan(newPointer);
  }

  function handleTouchStart(event: React.TouchEvent) {
    if (event.touches.length === 1) handleTapStart(event);
    else if (event.touches.length === 2) handlePinchStart(event);
  }

  function handleTouchMove(event: React.TouchEvent) {
    if (event.touches.length === 1) handleTapMove(event);
    else if (event.touches.length === 2) handlePinchMove(event);
  }

  function handleTouchEnd(event: React.TouchEvent) {
    setPanning(false);
    if (event.touches.length > 0) return;
    if (lastTouchEnd && lastTouchEnd + DOUBLE_CLICK_THRESHOLD > event.timeStamp)
      reset();
    setLastTouchEnd(event.timeStamp);
  }

  function handleWheel(event: React.WheelEvent) {
    const clientCursor = getClientPointFromEvent(event);
    const newZoom = event.deltaY < 0 ? zoom + 1 : zoom - 1;
    handleZoom(newZoom, clientCursor);
  }

  function reset() {
    setViewBox(INITIAL_VIEWBOX);
  }

  function handleZoom(newZoom: number, centre: Point) {
    if (newZoom < MIN_ZOOM || newZoom > maxZoom || !svgRef.current) return;

    const bbox = svgRef.current.getBoundingClientRect();
    const scale = Math.pow(2, newZoom - 1);
    const width = INITIAL_VIEWBOX.width / scale;
    const height = INITIAL_VIEWBOX.height / scale;

    const x =
      viewBox.x - ((centre.x - bbox.x) / bbox.width) * (width - viewBox.width);
    const y =
      viewBox.y -
      ((centre.y - bbox.y) / bbox.height) * (height - viewBox.height);

    setViewBox({
      x,
      y,
      width,
      height
    });
    setZoom(newZoom);
  }

  return (
    <svg
      className={panning ? 'panning' : ''}
      ref={svgRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}>
      <rect
        vectorEffect="non-scaling-stroke"
        x="40"
        y="40"
        width="20"
        height="20"
      />
    </svg>
  );
}

export default SvgContainer;

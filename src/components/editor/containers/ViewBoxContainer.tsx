import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  SVGProps,
  useCallback
} from 'react';
import { gsap } from 'gsap';

const DOUBLE_CLICK_THRESHOLD = 300;
const MIN_ZOOM = 1;
const VIEWBOX_EASE = 'power4.out';
const VIEWBOX_ANIMATION_DURATION = 0.1;

interface ContainerProps {
  name: string;
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

function ViewBoxContainer({ name, maxZoom = 10 }: ContainerProps) {
  const [loading, setLoading] = useState(false);
  const svgComponentRef = useRef<React.FC<React.SVGProps<SVGSVGElement>>>();
  const [svg, setSvg] = useState<SVGSVGElement>();
  const [initialViewBox, setInitialViewBox] = useState<ViewBox>();
  const [viewBox, setViewBox] = useState<ViewBox>();
  const [panning, setPanning] = useState(false);
  const [pointer, setPointer] = useState<Point>();
  const [zoom, setZoom] = useState(1);
  const [lastPinchDistance, setLastPinchDistance] = useState<number>();
  const [lastTouchEnd, setLastTouchEnd] = useState<number>();
  const [lastMiddleClick, setLastMiddleClick] = useState<number>();

  const svgRef = useCallback((node: SVGSVGElement) => {
    const vb = node.viewBox.baseVal;
    console.log(node);
    setInitialViewBox({ x: vb.x, y: vb.y, width: vb.width, height: vb.height });
    setSvg(node);
  }, []);

  useEffect(() => {
    setViewBox(initialViewBox);
  }, [initialViewBox]);

  useEffect(() => {
    if (svg && viewBox) {
      gsap.to(svg, {
        attr: { viewBox: getViewBoxString(viewBox) },
        duration: VIEWBOX_ANIMATION_DURATION,
        ease: VIEWBOX_EASE
      });
    }
  }, [viewBox, svg]);

  useEffect(() => {
    setLoading(true);
    async function importSvg() {
      try {
        svgComponentRef.current = (
          await import(
            `!!@svgr/webpack?-svgo,+titleProp,+ref!../../../svg/${name}.svg`
          )
        ).default;
      } catch (error) {
        throw error;
      } finally {
        setLoading(false);
      }
    }
    importSvg();
  }, [name]);

  useEffect(() => {
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, []);

  function handleMouseDown(event: React.MouseEvent): void {
    event.preventDefault();
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
    event.preventDefault();
    const newPointer = getClientPointFromEvent(event);
    handlePan(newPointer);
  }

  function handlePan(newPointer: Point) {
    if (panning && pointer && svg && viewBox) {
      const bbox = svg.getBoundingClientRect();
      const viewBoxRatio = viewBox.width / bbox.width;
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
    setViewBox(initialViewBox);
  }

  function handleZoom(newZoom: number, centre: Point) {
    if (
      newZoom < MIN_ZOOM ||
      newZoom > maxZoom ||
      !initialViewBox ||
      !svg ||
      !viewBox
    )
      return;

    const bbox = svg.getBoundingClientRect();
    const scale = Math.pow(2, newZoom - 1);
    const width = initialViewBox.width / scale;
    const height = initialViewBox.height / scale;

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

  const { current: Svg } = svgComponentRef;
  if (!Svg) return null;
  return (
    <Svg
      ref={svgRef}
      className={panning ? 'panning' : ''}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    />
  );
}

export default ViewBoxContainer;

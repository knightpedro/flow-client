import React, { useState, useRef, useEffect, useMemo } from 'react';

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

function getViewBoxString(viewBox: ViewBox): string {
  const { x, y, width, height } = viewBox;
  return `${x} ${y} ${width} ${height}`;
}

function Container({ maxZoom = 10 }: ContainerProps) {
  const originalViewBox = {
    x: 0,
    y: 0,
    width: 1024,
    height: 1024
  };
  const [viewBox, setViewBox] = useState<ViewBox>(originalViewBox);
  const [viewBoxRatio, setViewBoxRatio] = useState(1);
  const [panning, setPanning] = useState(false);
  const [pointer, setPointer] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const svgRef = useRef<SVGSVGElement>(null);

  const viewBoxString = useMemo(() => {
    return getViewBoxString(viewBox);
  }, [viewBox]);

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
    };
  });

  useEffect(() => {
    if (svgRef.current) {
      setViewBoxRatio(
        viewBox.width / svgRef.current.getBoundingClientRect().width
      );
    }
  }, [viewBox.width, setViewBoxRatio]);

  function getClientPointFromEvent(event: React.MouseEvent): Point {
    return { x: event.clientX, y: event.clientY };
  }

  function getLocalPointFromClientPoint(point: Point): Point {
    if (!svgRef.current) return point;
    const clientPoint = svgRef.current.createSVGPoint();
    clientPoint.x = point.x;
    clientPoint.y = point.y;
    return clientPoint.matrixTransform(
      svgRef.current.getScreenCTM()?.inverse()
    );
  }

  function handleMouseDown(event: React.MouseEvent): void {
    if (event.button === 0) {
      setPanning(true);
      setPointer(getClientPointFromEvent(event));
    }
  }

  function handleMouseUp(): void {
    setPanning(false);
  }

  function handleMouseMove(event: React.MouseEvent): void {
    if (panning) {
      const newPointer = getClientPointFromEvent(event);
      setViewBox({
        x: viewBox.x - (newPointer.x - pointer.x) * viewBoxRatio,
        y: viewBox.y - (newPointer.y - pointer.y) * viewBoxRatio,
        width: viewBox.width,
        height: viewBox.height
      });
      setPointer(newPointer);
    }
  }

  function handleWheel(event: React.WheelEvent) {
    const clientCursor = getClientPointFromEvent(event);
    const localCursor = getLocalPointFromClientPoint(clientCursor);

    let newZoom: number;
    if (event.deltaY < 0) {
      newZoom = zoom + 1;
    } else {
      newZoom = zoom - 1;
    }
    if (newZoom < 1 || newZoom > maxZoom) return;

    const width = originalViewBox.width / Math.pow(2, newZoom - 1);
    const height = originalViewBox.height / Math.pow(2, newZoom - 1);
    const x =
      viewBox.x -
      (localCursor.x / originalViewBox.width) * (width - viewBox.width);
    const y =
      viewBox.y -
      (localCursor.y / originalViewBox.height) * (height - viewBox.height);
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
      ref={svgRef}
      viewBox={viewBoxString}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onWheel={handleWheel}>
      <rect x="462" y="462" width="100" height="100" />
    </svg>
  );
}

export default Container;

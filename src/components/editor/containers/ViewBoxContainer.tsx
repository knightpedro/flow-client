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

function ViewBoxContainer({ maxZoom = 10 }: ContainerProps) {
  const initialViewBox = {
    x: 0,
    y: 0,
    width: 100,
    height: 100
  };
  const [viewBox, setViewBox] = useState<ViewBox>(initialViewBox);
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

  function handleWheel(event: React.WheelEvent) {
    const clientCursor = getClientPointFromEvent(event);

    const newZoom = event.deltaY < 0 ? zoom + 1 : zoom - 1;
    if (newZoom < 1 || newZoom > maxZoom) return;

    const bbox = svgRef.current?.getBoundingClientRect();
    if (!bbox) return;

    const scale = Math.pow(2, newZoom - 1)
    const width = initialViewBox.width / scale;
    const height = initialViewBox.height /scale;

    const x =
      viewBox.x -
      ((clientCursor.x - bbox.x) / bbox.width) * (width - viewBox.width);
    const y =
      viewBox.y -
      ((clientCursor.y - bbox.y) / bbox.height) * (height - viewBox.height);

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
        <rect x="40" y="40" width="20" height="20"/>
    </svg>
  );
}

export default ViewBoxContainer;

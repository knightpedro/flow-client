import React, { useState, useRef } from 'react';

interface Point {
  x: number;
  y: number;
}

interface ViewBox extends Point {
  width: number;
  height: number;
}

function getPointFromEvent(event: React.MouseEvent): Point {
  return { x: event.clientX, y: event.clientY };
}

function getViewBoxString(viewBox: ViewBox): string {
  const { x, y, width, height } = viewBox;
  return `${x} ${y} ${width} ${height}`;
}

function Container() {
  const [viewBox, setViewBox] = useState<ViewBox>({
    x: 0,
    y: 0,
    width: 300,
    height: 300
  });
  const [pointerDown, setPointerDown] = useState(false);
  const [pointer, setPointer] = useState<Point>({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  function handleMouseDown(event: React.MouseEvent): void {
    setPointer(getPointFromEvent(event));
    setPointerDown(true);
  }

  function handleMouseUp(): void {
    setPointerDown(false);
  }

  function handleMouseLeave(): void {
    setPointerDown(false);
  }

  function handleMouseMove(event: React.MouseEvent): void {
    if (pointerDown && svgRef.current) {
      const ratio =
        viewBox.width / svgRef.current.getBoundingClientRect().width;
      const newPointer = getPointFromEvent(event);
      setViewBox({
        x: viewBox.x - (newPointer.x - pointer.x) * ratio,
        y: viewBox.y - (newPointer.y - pointer.y) * ratio,
        width: viewBox.width,
        height: viewBox.height
      });
      setPointer(getPointFromEvent(event));
    }
  }

  function handleWheel(event: React.WheelEvent) {
    console.log(event.deltaY);
  }

  return (
    <svg
      ref={svgRef}
      viewBox={getViewBoxString(viewBox)}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      onWheel={handleWheel}>
      <rect x="150" y="100" width="100" height="100" />
    </svg>
  );
}

export default Container;

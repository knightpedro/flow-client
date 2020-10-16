import React, { useRef } from 'react';
import { useSvgPanZoom } from '../../../hooks';
import { ReactComponent as SVG } from '../../../svg/test.svg';

export default function PanZoomContainer() {
  const svgRef = useRef<SVGSVGElement>(null);

  const {
    handleMouseDown,
    handleMouseLeave,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    viewBox
  } = useSvgPanZoom(svgRef);

  return (
    <SVG
      ref={svgRef}
      viewBox={viewBox}
      onMouseDown={handleMouseDown}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
    />
  );
}

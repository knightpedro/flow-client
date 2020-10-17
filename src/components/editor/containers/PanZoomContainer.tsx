import React, { useRef } from 'react';
import { useSvgPanZoom } from '../../../hooks';
import { ReactComponent as SVG } from '../../../svg/test.svg';

export default function PanZoomContainer() {
  const svgRef = useRef<SVGSVGElement>(null);

  const options = {
    panDisabled: false,
    zoomDisabled: false,
    zoomMax: 8,
    zoomMin: 0
  };

  const {
    handleMouseDown,
    handleMouseLeave,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleWheel,
    panTo,
    viewBox
  } = useSvgPanZoom(svgRef, options);

  const handleClick = (e: React.MouseEvent) => {};

  return (
    <SVG
      ref={svgRef}
      viewBox={viewBox}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    />
  );
}

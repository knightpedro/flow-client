import React from 'react';
import styled from 'styled-components';

interface CanvasProps {
  elements: JSX.Element[];
  height: string;
  onClick?: React.MouseEventHandler;
  width: string;
}

const StyledSVG = styled.svg`
  background-color: white;
  border: 1px solid black;
`;

const Canvas = React.forwardRef<SVGSVGElement, CanvasProps>(
  ({ elements, height, onClick, width }, ref) => {
    return (
      <StyledSVG
        ref={ref}
        onClick={onClick}
        style={{ width: width, height: height }}>
        {elements}
      </StyledSVG>
    );
  }
);

export default Canvas;

import React, { useRef, useState } from 'react';
import {
  faCircle,
  faSquare,
  faHexagon,
  faHorizontalRule,
  faText
} from '@fortawesome/pro-regular-svg-icons';
import CreatePanel from './CreatePanel';
import Canvas from './Canvas';
import EditPanel from './EditPanel';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { v4 as uuid } from 'uuid';
import { clientPointToSvgPoint, getPointFromEvent } from '../../utils';
import { Point } from '../../interfaces';

const Container = styled.div`
  display: flex;
  height: 400px;
`;

enum Modes {
  VIEW,
  DRAW,
  EDIT
}

const elements = [
  {
    name: 'line',
    icon: <FontAwesomeIcon icon={faHorizontalRule} />,
    component: <path />
  },
  {
    name: 'circle',
    icon: <FontAwesomeIcon icon={faCircle} />,
    component: <circle r="20" />
  },
  {
    name: 'rect',
    icon: <FontAwesomeIcon icon={faSquare} />,
    component: <rect width="20" height="20" />
  },
  {
    name: 'polygon',
    icon: <FontAwesomeIcon icon={faHexagon} />,
    component: <polygon />
  },
  {
    name: 'text',
    icon: <FontAwesomeIcon icon={faText} />,
    component: <text>Edit text</text>
  }
];

function Editor() {
  const [mode, setMode] = useState(Modes.VIEW);
  const [tool, setTool] = useState<string>();
  const [components, setComponents] = useState<JSX.Element[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);

  const addComponent = (e: React.MouseEvent) => {
    const element = elements.find((e) => e.name === tool);
    if (!element || !svgRef.current) return;
    const clientPoint = getPointFromEvent(e);
    const svgPoint = clientPointToSvgPoint(clientPoint, svgRef.current);
    const newComponent = createComponent(element.component, svgPoint);
    setComponents((prev) => [...prev, newComponent]);
  };

  const createComponent = (component: JSX.Element, position: Point) => {
    const id = uuid();
    let props;
    if (component.type === 'circle') {
      props = {
        cx: position.x,
        cy: position.y
      };
    } else {
      props = {
        x: position.x,
        y: position.y
      };
    }
    return (
      <component.type id={id} key={id} {...component.props} {...props}>
        {component.props.children}
      </component.type>
    );
  };

  const handleSvgClick: React.MouseEventHandler = (e) => {
    if (mode !== Modes.DRAW) return;
    addComponent(e);
    setTool(undefined);
    setMode(Modes.VIEW);
  };

  const handleCreateClick = (elementType: string) => {
    setMode(Modes.DRAW);
    setTool(elementType);
  };

  return (
    <Container>
      <CreatePanel
        elements={elements}
        selected={tool}
        onClick={handleCreateClick}
      />
      <Canvas
        ref={svgRef}
        elements={components}
        onClick={handleSvgClick}
        height="400px"
        width="500px"
      />
      <EditPanel />
    </Container>
  );
}

export default Editor;

import React, { useReducer, useRef, useState } from 'react';
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

export interface GraphicDef {
  component: (props: any) => JSX.Element;
  getInitialProps: (p: Point) => Object;
  icon: JSX.Element;
}

interface EditorState {
  graphics: JSX.Element[];
  selectedIndex?: number;
  selectedTool?: string;
  lastPoint?: Point;
  mode: number;
}

interface EditorAction {
  type: string;
  payload: { name?: string; point?: Point };
}

const Container = styled.div`
  display: flex;
  height: 400px;
`;

enum Modes {
  VIEW,
  DRAW,
  EDIT
}

const graphicsMap: { [key: string]: GraphicDef } = {
  circle: {
    icon: <FontAwesomeIcon icon={faCircle} />,
    component: (props: any) => <circle {...props} />,
    getInitialProps: (p: Point) => ({ cx: p.x, cy: p.y })
  },
  line: {
    icon: <FontAwesomeIcon icon={faHorizontalRule} />,
    component: (props: any) => <path {...props} />,
    getInitialProps: (p: Point) => ({ x: p.x, y: p.y })
  },
  polygon: {
    icon: <FontAwesomeIcon icon={faHexagon} />,
    component: (props: any) => <path {...props} />,
    getInitialProps: (p: Point) => ({ x: p.x, y: p.y })
  },
  rect: {
    icon: <FontAwesomeIcon icon={faSquare} />,
    component: (props: any) => <rect {...props} />,
    getInitialProps: (p: Point) => ({ x: p.x, y: p.y })
  },
  text: {
    icon: <FontAwesomeIcon icon={faText} />,
    component: (props: any) => <text {...props}>Default text</text>,
    getInitialProps: (p: Point) => ({ x: p.x, y: p.y })
  }
};

const initialState: EditorState = {
  graphics: [],
  mode: Modes.VIEW
};

function createGraphic(name: string, point: Point) {
  const graphicDef = graphicsMap[name];
  if (!graphicDef) throw Error(`No definition found for ${name}`);
  const props = graphicDef.getInitialProps(point);
  const id = uuid();
  return graphicDef.component({ id, key: id, ...props });
}

function reducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'create':
      const { name } = action.payload;
      return {
        ...state,
        selectedTool: name,
        mode: Modes.DRAW
      };
    case 'click':
      const { point } = action.payload;
      if (point && state.selectedTool && state.mode !== Modes.VIEW) {
        const graphic = createGraphic(state.selectedTool, point);
        return {
          ...state,
          graphics: [...state.graphics, graphic],
          selectedTool: undefined,
          lastPoint: point,
          mode: Modes.VIEW // To be modified
        };
      }
      return state;
    default:
      return state;
  }
}

function Editor() {
  const [{ graphics, selectedTool }, dispatch] = useReducer(
    reducer,
    initialState
  );
  const svgRef = useRef<SVGSVGElement>(null);

  const graphicTools = Object.keys(graphicsMap).map((k) => ({
    name: k,
    ...graphicsMap[k]
  }));

  const handleSvgClick: React.MouseEventHandler = (e) => {
    if (!svgRef.current) return;
    const clientPoint = getPointFromEvent(e);
    const svgPoint = clientPointToSvgPoint(clientPoint, svgRef.current);
    dispatch({ type: 'click', payload: { point: svgPoint } });
  };

  const handleCreateClick = (elementType: string) => {
    dispatch({ type: 'create', payload: { name: elementType } });
  };

  return (
    <Container>
      <CreatePanel
        elements={graphicTools}
        selected={selectedTool}
        onClick={handleCreateClick}
      />
      <Canvas
        ref={svgRef}
        elements={graphics}
        onClick={handleSvgClick}
        height="400px"
        width="500px"
      />
      <EditPanel />
    </Container>
  );
}

export default Editor;

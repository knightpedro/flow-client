import React from 'react';
import styled from 'styled-components';

interface EditorTool {
  name: string;
  icon: JSX.Element;
}

interface CreatePanelProps {
  elements: EditorTool[];
  onClick: (e: string) => void;
  selected?: string;
}

interface CreatePanelButtonProps {
  active: boolean;
}

const Panel = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #d3d3d3;
`;

const PanelButton = styled.button<CreatePanelButtonProps>`
  height: 40px;
  width: 40px;
  font-size: 20px;
  margin-top: 2px;
  margin-left: 2px;
  background-color: ${({ active }) => (active ? 'green' : '')};
`;

function CreatePanel({ elements, onClick, selected }: CreatePanelProps) {
  return (
    <Panel>
      {elements.map((e, i) => (
        <PanelButton
          key={i}
          title={e.name}
          active={e.name === selected}
          onClick={() => onClick(e.name)}>
          {e.icon}
        </PanelButton>
      ))}
    </Panel>
  );
}

export default CreatePanel;

import React from 'react';
import Container from './container/Container';
import './editor.css';

interface EditorProps {}

function Editor() {
  return (
    <div style={{ height: '600px', width: '800px' }}>
      <Container />
    </div>
  );
}

export default Editor;

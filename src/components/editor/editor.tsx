import React from 'react';
import ViewBoxContainer from './containers/ViewBoxContainer';
import './editor.css';

function Editor() {
  return (
    <div style={{ height: '600px', width: '600px' }}>
      <ViewBoxContainer name="test" />
    </div>
  );
}

export default Editor;

import React from 'react';
import PanZoomContainer from './containers/PanZoomContainer';
import './editor.css';

function Editor() {
  return (
    <div style={{ height: '500px', width: '700px' }}>
      <PanZoomContainer />
    </div>
  );
}

export default Editor;

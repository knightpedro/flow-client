import React from 'react';
import SvgContainer from './containers/SvgContainer';
import './editor.css';

function Editor() {
  return (
    <div style={{ height: '600px', width: '600px' }}>
      <SvgContainer />
    </div>
  );
}

export default Editor;

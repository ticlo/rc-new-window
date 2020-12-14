import React, { Component, useRef, useState } from 'react';
import NewWindow from '../src';
import { mapWindowToElement } from '../src/ScreenPosition';

const blankRect = { left: 0, top: 0, width: 0, height: 0 };
export default () => {
  const [open, setOpen] = useState(false);
  const [win, setWin] = useState();
  const [rect, setRect] = useState(blankRect);
  const ref = useRef();

  const getPosition = () => {
    setRect(mapWindowToElement(ref.current, win));
  };

  return (
    <>
      <div ref={ref}
           style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0.5, pointerEvents: 'none' }}>
        <div style={{ ...rect, background: '#CCCCFF', position: 'absolute', overflow: 'hidden' }}>
          popup content area
        </div>
      </div>
      <button onClick={() => setOpen(v => !v)}>Open/Close Window</button>
      <button onClick={getPosition} disabled={!open || !win}>Get window position</button>
      <p>
        Map popup content area to element coordinates, even with browser zoom, element scaling or iframe.
      </p>

      {open ? (
        <NewWindow onClose={() => setOpen(false)} onOpen={setWin}>
          <div>hello</div>
        </NewWindow>
      ) : null}
    </>
  );
};

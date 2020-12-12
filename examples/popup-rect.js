import React, { Component, useRef, useState } from 'react';
import NewWindow from '../src';
import { mapElementToScreenRect } from '../src/ScreenPosition';

export default () => {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  const initPosition = () => {
    return mapElementToScreenRect(ref.current, null);
  };
  return (
    <>
      <button onClick={() => setOpen(v => !v)}>Open/Close Window</button>
      <p>
        Popup should open with same position and size as the blue rectangle, even with browser zoom
        or element scaling.
      </p>
      <div ref={ref} style={{ width: 300, height: 300, background: '#CCCCFF' }}>
        hello
      </div>
      {open ? (
        <NewWindow onClose={() => setOpen(false)} initPosition={initPosition}>
          <div>hello</div>
        </NewWindow>
      ) : null}
    </>
  );
};

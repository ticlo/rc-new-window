import React, { Component, useState } from 'react';
import NewWindow from '../src';

export default () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)}>Open Window</button>
      {open ? <NewWindow onUnload={() => setOpen(false)}>hello</NewWindow> : null}
    </>
  );
};

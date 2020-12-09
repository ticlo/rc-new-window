import React, { Component, useState } from 'react';
import NewWindow from '../src';

export default () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(v => !v)}>Open/Close Window</button>
      {open ? <NewWindow onClose={() => setOpen(false)}>hello</NewWindow> : null}
    </>
  );
};

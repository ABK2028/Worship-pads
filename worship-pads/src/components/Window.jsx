import { useEffect, useRef, useState } from 'react';

export default function Window({ title = 'Window', children, initiallyOpen = false, onClose }) {
  const storageKey = `worship.window.${title.replace(/\s+/g, '-').toLowerCase()}`;
  const [open, setOpen] = useState(initiallyOpen);
  const [minimized, setMinimized] = useState(false);
  const [pos, setPos] = useState({ x: 80, y: 80 });
  const [size, setSize] = useState({ w: 640, h: 360 });
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const startPos = useRef({ x: 0, y: 0 });
  const resizing = useRef(false);
  const resizeStart = useRef({ x: 0, y: 0 });
  const startSize = useRef({ w: 0, h: 0 });
  const elRef = useRef(null);

  useEffect(() => {
    // load persisted state
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const st = JSON.parse(raw);
        if (st.pos) setPos(st.pos);
        if (st.size) setSize(st.size);
        if (typeof st.open === 'boolean') setOpen(st.open);
        if (typeof st.minimized === 'boolean') setMinimized(st.minimized);
      }
    } catch (e) {
      // ignore
    }

    const onMove = (e) => {
      if (dragging.current) {
        const dx = e.clientX - dragStart.current.x;
        const dy = e.clientY - dragStart.current.y;
        setPos({ x: Math.max(8, startPos.current.x + dx), y: Math.max(8, startPos.current.y + dy) });
      }
      if (resizing.current) {
        const dx = e.clientX - resizeStart.current.x;
        const dy = e.clientY - resizeStart.current.y;
        setSize({ w: Math.max(200, startSize.current.w + dx), h: Math.max(120, startSize.current.h + dy) });
      }
    };

    const onUp = () => {
      dragging.current = false;
      resizing.current = false;
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  // persist state
  useEffect(() => {
    try {
      const st = { pos, size, open, minimized };
      window.localStorage.setItem(storageKey, JSON.stringify(st));
    } catch (e) {
      // ignore
    }
  }, [pos, size, open, minimized]);

  const startDrag = (e) => {
    dragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    startPos.current = { ...pos };
  };

  const startResize = (e) => {
    e.stopPropagation();
    resizing.current = true;
    resizeStart.current = { x: e.clientX, y: e.clientY };
    startSize.current = { ...size };
  };

  const openWindow = () => setOpen(true);
  const closeWindow = () => {
    setOpen(false);
    if (onClose) onClose();
  };

  const toggleMinimize = () => setMinimized((v) => !v);

  const onKeyDown = (e) => {
    // move with arrows, close with Escape, toggle minimize with 'm'
    if (e.key === 'Escape') {
      closeWindow();
    }
    if (e.key === 'm' || e.key === 'M') {
      toggleMinimize();
    }
    const step = e.shiftKey ? 30 : 10;
    if (e.key === 'ArrowLeft') setPos((p) => ({ ...p, x: Math.max(0, p.x - step) }));
    if (e.key === 'ArrowRight') setPos((p) => ({ ...p, x: Math.min(window.innerWidth - 80, p.x + step) }));
    if (e.key === 'ArrowUp') setPos((p) => ({ ...p, y: Math.max(0, p.y - step) }));
    if (e.key === 'ArrowDown') setPos((p) => ({ ...p, y: Math.min(window.innerHeight - 40, p.y + step) }));
  };

  return (
    <>
      {!open && (
        <button className="window-launch" onClick={openWindow}>
          Open {title}
        </button>
      )}

      {open && (
        <div
          ref={elRef}
          className={`window ${minimized ? 'window-minimized' : ''}`}
          style={{ left: pos.x, top: pos.y, width: size.w, height: minimized ? 48 : size.h }}
          tabIndex={0}
          role="dialog"
          aria-label={title}
          onKeyDown={onKeyDown}
          onDoubleClick={() => setMinimized(false)}
        >
          <div className="window-titlebar" onMouseDown={startDrag}>
            <div className="window-title">{title}</div>
            <div className="window-actions">
              <button title="Maximize" onClick={() => setSize({ w: window.innerWidth - 40, h: window.innerHeight - 80 })}>▢</button>
              <button title="Minimize" onClick={toggleMinimize}>—</button>
              <button title="Close" onClick={closeWindow}>✕</button>
            </div>
          </div>
          {!minimized && <div className="window-body">{children}</div>}
          {!minimized && <div className="window-resize" onMouseDown={startResize} />}
        </div>
      )}
    </>
  );
}

import { useState } from 'react';
import { config } from '../config';

export function useSidebarResize() {
  const [sidebarWidth, setSidebarWidth] = useState<number>(config.sidebar.defaultWidth);

  function onHandleMouseDown(e: React.MouseEvent) {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    function onMouseMove(ev: MouseEvent) {
      setSidebarWidth(Math.max(config.sidebar.minWidth, Math.min(config.sidebar.maxWidth, startWidth + startX - ev.clientX)));
    }

    function onMouseUp() {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  return { sidebarWidth, onHandleMouseDown };
}

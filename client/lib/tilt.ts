import * as React from "react";

export function createSmoothTiltHandlers(maxDeg = 6, scale = 1.03) {
  let targetX = 0;
  let targetY = 0;
  let curX = 0;
  let curY = 0;
  let raf = 0;
  let el: HTMLElement | null = null;

  const animate = () => {
    if (!el) return;
    curX += (targetX - curX) * 0.12;
    curY += (targetY - curY) * 0.12;
    el.style.transform = `perspective(1000px) rotateX(${curY.toFixed(2)}deg) rotateY(${curX.toFixed(2)}deg) scale(${scale})`;
    raf = requestAnimationFrame(animate);
  };

  const onMouseEnter: React.MouseEventHandler<HTMLElement> = (e) => {
    el = e.currentTarget as HTMLElement;
    if (!raf) raf = requestAnimationFrame(animate);
  };
  const onMouseMove: React.MouseEventHandler<HTMLElement> = (e) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    targetX = x * maxDeg;
    targetY = -y * maxDeg;
  };
  const onMouseLeave: React.MouseEventHandler<HTMLElement> = () => {
    cancelAnimationFrame(raf);
    raf = 0;
    if (el) el.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)";
    el = null;
  };

  return { onMouseEnter, onMouseMove, onMouseLeave } as const;
}

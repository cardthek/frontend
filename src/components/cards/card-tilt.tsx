"use client";

import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function CardTilt({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0, active: false });

  function updateTilt(clientX: number, clientY: number) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (clientX - rect.left) / rect.width - 0.5;
    const y = (clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: -y * 5, y: x * 7, active: true });
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    updateTilt(event.clientX, event.clientY);
  }

  function resetTilt() {
    setTilt({ x: 0, y: 0, active: false });
  }

  return (
    <div
      ref={containerRef}
      className={cn("[perspective:1000px]", className)}
      style={style}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetTilt}
      onPointerCancel={resetTilt}
    >
      <div
        className="transition-transform duration-150 ease-out will-change-transform motion-reduce:transform-none motion-reduce:transition-none"
        style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${tilt.active ? 1.012 : 1})` }}
      >
        {children}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState, type ElementType } from "react";

type RevealProps = {
  children: React.ReactNode;
  /** Stagger sibling reveals, in milliseconds. */
  delay?: number;
  className?: string;
  as?: ElementType;
};

/**
 * Lifts and fades its children into place the first time they enter the
 * viewport. The motion lives in globals.css (`.reveal`), which also disables it
 * under `prefers-reduced-motion` — so there is no preference branching here.
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setRevealed(true);
        observer.disconnect();
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`reveal ${className}`}
      data-revealed={revealed}
      style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </Tag>
  );
}

import React, { useEffect, useRef, useState } from 'react';
import { motion, useSpring, useMotionValue } from 'motion/react';

const INTERACTIVE = [
  'a[href]', 'button', 'summary', 'select', 'label',
  '[role="button"]', '[role="link"]', '[role="menuitem"]',
  '[tabindex]:not([tabindex="-1"])', '.interactive', '[data-cursor="button"]',
].join(', ');

const INPUT = [
  'textarea',
  'input:not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="file"]):not([type="color"])',
  '[contenteditable=""]', '[contenteditable="true"]', '[role="textbox"]',
].join(', ');

const TEXT = [
  'p', 'span', 'li', 'blockquote', 'figcaption', 'small',
  'strong', 'em', 'code', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  '[data-cursor="text"]',
].join(', ');

type CursorType = 'default' | 'interactive' | 'input' | 'text';

export default function Cursor() {
  const mouse = { x: useMotionValue(0), y: useMotionValue(0) };
  const springConfig = { damping: 25, stiffness: 250, mass: 0.5 };
  const cursorX = useSpring(mouse.x, springConfig);
  const cursorY = useSpring(mouse.y, springConfig);

  const [type, setType] = useState<CursorType>('default');
  // Throttle type changes — only setState when type actually changes
  const typeRef = useRef<CursorType>('default');

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.x.set(e.clientX);
      mouse.y.set(e.clientY);
    };

    const onOver = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      const next: CursorType = t.closest(INTERACTIVE) ? 'interactive'
        : t.closest(INPUT) ? 'input'
        : t.closest(TEXT) ? 'text'
        : 'default';
      // Only call setState when type actually changes — avoids unnecessary re-renders
      if (next !== typeRef.current) {
        typeRef.current = next;
        setType(next);
      }
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseover', onOver, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseover', onOver);
    };
  }, [mouse.x, mouse.y]);

  const isInteractive = type === 'interactive';
  const isInput       = type === 'input';
  const isText        = type === 'text';

  return (
    <>
      {/* Dot — base 12px, use scaleX/scaleY instead of width/height */}
      <motion.div
        className="fixed top-0 left-0 rounded-full pointer-events-none z-[10000] bg-premium-orange"
        style={{
          x: cursorX, y: cursorY,
          translateX: '-50%', translateY: '-50%',
          width: 12, height: 12,
          willChange: 'transform',
        }}
        animate={{
          scaleX:  isInteractive ? 0.35 : isText ? 0.15 : 1,
          scaleY:  isInteractive ? 0.35 : isText ? 1.6  : 1,
          opacity: isInteractive ? 0    : 1,
          borderRadius: isText ? 2 : 9999,
        }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
      />

      {/* Ring — base 40×40, use scale instead of width/height animation */}
      <motion.div
        className="fixed top-0 left-0 border border-premium-orange/30 pointer-events-none z-[9999] rounded-full"
        style={{
          x: mouse.x, y: mouse.y,
          translateX: '-50%', translateY: '-50%',
          width: 40, height: 40,
          willChange: 'transform',
        }}
        animate={{
          scaleX:      isInteractive || isText ? 0.45 : 1,
          scaleY:      isInteractive ? 0.45 : isText ? 0.7 : 1,
          opacity:     isInput || isInteractive ? 0 : isText ? 0.35 : 1,
          borderColor: isInteractive
            ? 'rgba(227, 6, 19, 0)'
            : isText
            ? 'rgba(242, 125, 38, 0.45)'
            : 'rgba(242, 125, 38, 0.3)',
        }}
        transition={{ type: 'spring', damping: 24, stiffness: 170 }}
      />
    </>
  );
}
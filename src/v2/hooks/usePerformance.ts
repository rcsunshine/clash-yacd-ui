import { useState, useEffect, useRef } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  itemsRendered: number;
  totalItems: number;
  fps: number;
  memoryUsage: number;
}

export function usePerformance(enabled: boolean = false) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    itemsRendered: 0,
    totalItems: 0,
    fps: 0,
    memoryUsage: 0
  });

  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const startTimeRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    let animationId: number;

    const measureFPS = () => {
      frameCountRef.current++;
      const now = performance.now();
      const elapsed = now - lastTimeRef.current;

      if (elapsed >= 1000) {
        const fps = Math.round((frameCountRef.current * 1000) / elapsed);
        
        setMetrics(prev => ({
          ...prev,
          fps,
          memoryUsage: getMemoryUsage()
        }));

        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }

      animationId = requestAnimationFrame(measureFPS);
    };

    animationId = requestAnimationFrame(measureFPS);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [enabled]);

  const getMemoryUsage = (): number => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return Math.round(memory.usedJSHeapSize / 1024 / 1024); // MB
    }
    return 0;
  };

  const startRenderTimer = () => {
    startTimeRef.current = performance.now();
  };

  const endRenderTimer = (itemsRendered: number, totalItems: number) => {
    const renderTime = performance.now() - startTimeRef.current;
    setMetrics(prev => ({
      ...prev,
      renderTime: Math.round(renderTime * 100) / 100,
      itemsRendered,
      totalItems
    }));
  };

  return {
    metrics,
    startRenderTimer,
    endRenderTimer
  };
} 
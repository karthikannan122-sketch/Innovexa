import React, { useState, useEffect } from 'react';

/**
 * CountUp — Animated numeric transition component (Section 5: Micro-Detail Polish)
 * Smoothly interpolates numbers with an ease-out spring effect when values change.
 */
export default function CountUp({
  value = 0,
  duration = 750,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = ''
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const startVal = Number(displayValue) || 0;
    const endVal = Number(value) || 0;

    if (startVal === endVal) return;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Easing out cubic
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (endVal - startVal) * easedProgress;

      setDisplayValue(current);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setDisplayValue(endVal);
      }
    };

    const animId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animId);
  }, [value, duration]);

  const formatted = Number(displayValue).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });

  return (
    <span className={`count-up-value ${className}`}>
      {prefix}{formatted}{suffix}
    </span>
  );
}

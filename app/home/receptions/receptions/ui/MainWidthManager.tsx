'use client';

import { useEffect } from 'react';

interface MainWidthManagerProps {
  className: string;
}

const STYLE_ID_PREFIX = 'managed-main-width-';

// Applies a scoped class to the global <main> so that specific pages can override container width.
export function MainWidthManager({ className }: MainWidthManagerProps) {
  useEffect(() => {
    const mainElement = document.querySelector('main');
    if (!mainElement) {
      return;
    }

    const styleId = `${STYLE_ID_PREFIX}${className}`;
    const customClass = className;

    let styleElement = document.getElementById(styleId);
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      styleElement.textContent = `
        main.${customClass} {
          max-width: min(100%, 90rem);
          padding-left: 1rem;
          padding-right: 1rem;
        }

        @media (min-width: 1280px) {
          main.${customClass} {
            max-width: min(100%, 100rem);
            padding-left: 1.5rem;
            padding-right: 1.5rem;
          }
        }

        @media (min-width: 1536px) {
          main.${customClass} {
            max-width: min(100%, 112rem);
            padding-left: 2rem;
            padding-right: 2rem;
          }
        }
      `;
      document.head.appendChild(styleElement);
    }

    mainElement.classList.add(customClass);

    return () => {
      mainElement.classList.remove(customClass);
      const stillInUse = document.querySelector(`main.${customClass}`);
      if (!stillInUse && styleElement?.parentNode) {
        styleElement.parentNode.removeChild(styleElement);
      }
    };
  }, [className]);

  return null;
}

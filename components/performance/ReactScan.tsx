"use client";

import { scan } from "react-scan";
import { useEffect } from "react";

export function ReactScan() {
  useEffect(() => {
    // Only enable React Scan in development for now
    // We can adjust this later for production monitoring if needed
    scan({
      enabled: process.env.NODE_ENV === 'development',
      log: false, // Set to true for debugging render issues
      showToolbar: true,
      animationSpeed: "fast",
      trackUnnecessaryRenders: true, // Important for animation performance
      onRender: (fiber, renders) => {
        // Optional: Custom logging for animation performance
        const componentName = fiber.type?.name || 'Unknown';
        if (renders.length > 5) {
          console.warn(`🎬 High render count for ${componentName}:`, renders.length);
        }
      },
    });
  }, []);

  return null;
}
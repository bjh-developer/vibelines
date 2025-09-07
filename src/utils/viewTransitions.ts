// View Transitions utility for smooth page transitions
export function startViewTransition(updateFn: () => void): void {
  // Check if the browser supports View Transitions API
  if ('startViewTransition' in document) {
    (document as any).startViewTransition(updateFn);
  } else {
    // Fallback for browsers that don't support View Transitions
    updateFn();
  }
}

// Hook to wrap navigation with view transitions
export function useViewTransition() {
  const navigate = (callback: () => void) => {
    startViewTransition(callback);
  };

  return { navigate };
}

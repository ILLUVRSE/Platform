// Bridge to Parent
window.addEventListener('message', (event) => {
  if (event.data.type === 'arcade-init') {
      // Could re-init game with specific settings if needed
  }
});

// Signal ready
window.parent.postMessage({ type: 'arcade-ready' }, '*');

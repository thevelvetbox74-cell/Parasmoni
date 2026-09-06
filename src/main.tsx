import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Automatically register service worker for instant App Shell and media caching
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('Parasmoni App: New content available, updating background cache...');
  },
  onOfflineReady() {
    console.log('Parasmoni App: App Shell and assets are cached for offline/fast load.');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

# Parasmoni Jewellers — Performance Rules & Guidelines

To maintain optimal PageSpeed score (95+ Mobile & Desktop) and instant zero-CLS load times, all future code changes MUST follow these performance rules:

1. **Image Components & Roles**:
   - Always render images using `<Img role="..." />` or `<OptimizedImage />`.
   - Never use raw `<img>` tags or raw CSS `background-image` for product photos or hero banners on public routes.
   - Choose explicit role targets: `hero`, `peek`, `tile`, `card`, `detail`, `thumb`, `logo`.

2. **Domain-Aware Image URL Rewriting**:
   - ImageKit URLs MUST always specify explicit `tr=w-X,q-Y,f-auto`.
   - Unsplash URLs MUST use `?auto=format&fit=crop&q=Y&w=X` without ImageKit syntax (`f-auto` or `tr=`).
   - Percent-encoded filenames (e.g., Bengali text in filenames) must be preserved without double encoding.

3. **Firebase & Catalogue Data Fetching**:
   - Public catalogue reads MUST use `firestoreRest.ts` via lightweight REST queries or cached snapshots (`localStorage` / `homeSnapshot.json`).
   - Never import `firebase/*` directly on public routes or in the main entry chunk.
   - Dynamic dynamic import (`import('firebase/firestore')`) is allowed ONLY for admin routes or lazy post-paint fallback.

4. **Bundle & Chunk Size Discipline**:
   - Keep the initial JS entry chunk under 90 KB gzipped.
   - Use route-level `React.lazy` for all secondary routes and admin panels.
   - `manualChunks` in `vite.config.ts` must match exact package strings (`/node_modules/react/`, `/node_modules/react-dom/`).

5. **CSS & Animation Performance**:
   - Avoid `backdrop-filter`, `filter: blur`, or `mix-blend-mode` on large animated elements.
   - Animate ONLY GPU-composited properties: `transform` and `opacity`.
   - Respect `prefers-reduced-motion`.

6. **Agentic Browsing Compliance**:
   - NEVER modify or remove `public/llms.txt`, `public/.well-known/ai-catalog.json`, or their Netlify headers.

7. **Automated Guardrail**:
   - Run `node scripts/perf-guard.mjs` post-build to verify zero regressions.

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Self-contained server output in `.next/standalone` — a container copies it and
  // runs `node server.js` with no package install, which is what an offline /
  // closed-contour deploy needs (RULES §12). `next start` keeps working as before.
  output: 'standalone',
  // React Compiler — stable top-level key in Next 16 (was `experimental` in 15).
  // Requires the babel-plugin-react-compiler devDependency. Pitfall: the compiler
  // runs via Babel (not SWC), so builds are a bit slower — Next limits the cost by
  // only applying it to files with JSX/Hooks.
  reactCompiler: true,
};

export default nextConfig;

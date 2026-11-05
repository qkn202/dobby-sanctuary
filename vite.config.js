import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { defineConfig, loadEnv } from 'vite';
import { attachRoomRelay } from './server/roomRelay.js';
import { handleSanctuaryRequest } from './server/sanctuaryBackendCore.js';

function attachSanctuaryApiMiddleware(middlewares, env) {
  middlewares.use('/api/sanctuary', async (req, res, next) => {
    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }

    try {
      const fullUrl = new URL(req.url || '/', 'http://localhost');
      const query = Object.fromEntries(fullUrl.searchParams.entries());

      let body = {};
      if (req.method === 'POST') {
        const chunks = [];
        for await (const chunk of req) {
          chunks.push(chunk);
        }
        const raw = Buffer.concat(chunks).toString('utf8');
        if (raw.trim()) {
          try {
            body = JSON.parse(raw);
          } catch {
            body = {};
          }
        }
      }

      const result = await handleSanctuaryRequest({
        method: req.method || 'GET',
        query,
        body,
        env,
      });

      res.statusCode = result.status;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      res.end(JSON.stringify(result.payload));
    } catch (err) {
      next(err);
    }
  });
}

function sanctuaryRelayPlugin(env) {
  return {
    name: 'dobby-sanctuary-ws-and-api',
    configureServer(server) {
      attachSanctuaryApiMiddleware(server.middlewares, env);
      if (server.httpServer) {
        attachRoomRelay(server.httpServer);
      }
    },
    configurePreviewServer(server) {
      attachSanctuaryApiMiddleware(server.middlewares, env);
      if (server.httpServer) {
        attachRoomRelay(server.httpServer);
      }
    },
  };
}

const GZIP_EXTENSIONS = new Set(['.html', '.js', '.css', '.json', '.svg']);

async function compressDirRecursive(dirPath, summary) {
  const entries = await readdir(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      await compressDirRecursive(fullPath, summary);
      continue;
    }
    const ext = path.extname(entry.name).toLowerCase();
    if (!GZIP_EXTENSIONS.has(ext)) continue;
    const raw = await readFile(fullPath);
    if (raw.byteLength < 512) continue;
    const compressed = gzipSync(raw, { level: 9 });
    await writeFile(`${fullPath}.gz`, compressed);
    const info = await stat(`${fullPath}.gz`);
    summary.count += 1;
    summary.rawBytes += raw.byteLength;
    summary.gzBytes += info.size;
  }
}

function gzipStaticAssetsPlugin() {
  let outDir = 'dist';
  return {
    name: 'dobby-sanctuary-gzip-static',
    apply: 'build',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    async closeBundle() {
      const summary = { count: 0, rawBytes: 0, gzBytes: 0 };
      await compressDirRecursive(outDir, summary);
      const rawKb = (summary.rawBytes / 1024).toFixed(1);
      const gzKb = (summary.gzBytes / 1024).toFixed(1);
      console.log(`[gzip-static] Đã nén ${summary.count} tệp tĩnh (.gz): ${rawKb} kB -> ${gzKb} kB`);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = { ...process.env, ...loadEnv(mode, process.cwd(), '') };
  return {
    plugins: [sanctuaryRelayPlugin(env), gzipStaticAssetsPlugin()],
    build: {
      target: 'esnext',
      rollupOptions: {
        output: {
          manualChunks: {
            three: ['three'],
            supabase: ['@supabase/supabase-js'],
          },
        },
      },
      chunkSizeWarningLimit: 700,
    },
  };
});

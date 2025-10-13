import * as esbuild from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { copyFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

await esbuild.build({
    entryPoints: [join(__dirname, 'viewer.ts')],
    bundle: true,
    outfile: join(__dirname, '../out/webview.js'),
    format: 'iife',
    platform: 'browser',
    target: 'es2020',
    sourcemap: true,
    external: [],
});

// Copy WASM file to output directory
try {
    const wasmSrc = join(__dirname, '../node_modules/@rerun-io/web-viewer/re_viewer_bg.wasm');
    const wasmDest = join(__dirname, '../out/re_viewer_bg.wasm');
    copyFileSync(wasmSrc, wasmDest);
    console.log('Copied WASM file to output directory');
} catch (error) {
    console.error('Failed to copy WASM file:', error);
}

console.log('Webview bundle built successfully');

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const nodeModules = process.env.RUNTIME_NODE_MODULES;
const ffmpeg = process.env.FFMPEG_BIN;
const chromiumBin = process.env.CHROMIUM_BIN;
if (!nodeModules || !ffmpeg || !chromiumBin) throw new Error('RUNTIME_NODE_MODULES, FFMPEG_BIN and CHROMIUM_BIN are required');

const { chromium } = await import(pathToFileURL(path.join(nodeModules, 'playwright', 'index.mjs')).href);
const source = path.join(root, 'scripts', 'html-motion-demos.html');
const outputDir = path.join(root, 'html-deck', 'assets', 'generated');
const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'dlc-html-motion-'));
await fs.mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true, executablePath: chromiumBin });
const page = await browser.newPage({ viewport: { width: 600, height: 338 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(source).href);
await page.waitForFunction(() => typeof window.renderDemo === 'function');

const demos = [
  ['title', 'html-motion-focus.gif'],
  ['data', 'html-motion-data.gif'],
  ['transition', 'html-motion-transition.gif'],
];

for (const [name, outputName] of demos) {
  const frameDir = path.join(tempRoot, name);
  await fs.mkdir(frameDir, { recursive: true });
  const progress = [0, 0, ...Array.from({ length: 24 }, (_, i) => i / 23), 1, 1, 1, 1];
  for (let index = 0; index < progress.length; index += 1) {
    await page.evaluate(({ demo, p }) => window.renderDemo(demo, p), { demo: name, p: progress[index] });
    await page.screenshot({ path: path.join(frameDir, `frame-${String(index).padStart(3, '0')}.png`) });
  }
  const outputPath = path.join(outputDir, outputName);
  const result = spawnSync(ffmpeg, [
    '-y', '-hide_banner', '-loglevel', 'error',
    '-framerate', '12', '-i', path.join(frameDir, 'frame-%03d.png'),
    '-filter_complex', '[0:v]fps=12,split[a][b];[a]palettegen=max_colors=128[p];[b][p]paletteuse=dither=bayer:bayer_scale=3',
    '-loop', '0', outputPath,
  ], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`ffmpeg failed for ${name}: ${result.stderr}`);
  console.log(`${outputName}\t${(await fs.stat(outputPath)).size} bytes`);
}

await browser.close();
console.log(`frames: ${tempRoot}`);

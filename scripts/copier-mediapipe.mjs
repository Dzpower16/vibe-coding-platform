// Copie le WASM de MediaPipe depuis node_modules vers public/ (même version que le paquet JS).
import { cpSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const racine = join(dirname(fileURLToPath(import.meta.url)), '..')
const source = join(racine, 'node_modules', '@mediapipe', 'tasks-vision', 'wasm')
const cible = join(racine, 'public', 'mediapipe', 'wasm')

if (!existsSync(source)) {
  console.warn('[mediapipe] wasm introuvable, copie ignorée')
  process.exit(0)
}
mkdirSync(cible, { recursive: true })
for (const f of ['vision_wasm_internal.js', 'vision_wasm_internal.wasm']) {
  cpSync(join(source, f), join(cible, f))
}
console.log('[mediapipe] wasm copié dans public/mediapipe/wasm')

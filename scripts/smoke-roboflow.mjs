// Test de fumée du workflow Roboflow (lib/roboflow/workflow.ts).
// Usage : pnpm smoke:roboflow [chemin/image.jpg]   — exige ROBOFLOW_API_KEY dans l'environnement.
// Par défaut, une mire générée (aucune personne filmée) : on vérifie la forme de la réponse, pas la détection.
// Vérifie aussi un lot de 2 images (une seule requête) et le cache (2e appel sans requête).
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'
import { detecterMainsVisageEtSignes, detecterMainsVisageEtSignesLot, ErreurRoboflow } from '../lib/roboflow/workflow.ts'

const chemin = process.argv[2] ?? fileURLToPath(new URL('./fixtures/mire-test.jpg', import.meta.url))
const octets = await readFile(chemin)
const image = { type: 'base64', value: octets.toString('base64') }
// 2e image différente (même contenu + octets de fin ignorés par les décodeurs JPEG) : force un vrai lot de 2.
const image2 = { type: 'base64', value: Buffer.concat([octets, Buffer.from([0, 0])]).toString('base64') }

function verifier(resultat) {
  // Sortie déclarée par le workflow « lsq-mains-visage-et-signes-logic » : predictions (détections).
  assert.ok('predictions' in resultat, `sortie « predictions » absente (reçu : ${Object.keys(resultat).join(', ') || 'rien'})`)
  assert.equal(resultat.predictions.type, 'detections', 'la sortie « predictions » devrait contenir des détections')
  assert.ok(Array.isArray(resultat.predictions.detections))
}

let requetes = 0
const fetchOriginal = globalThis.fetch
globalThis.fetch = (...args) => {
  requetes++
  return fetchOriginal(...args)
}

try {
  let t = performance.now()
  const resultat = await detecterMainsVisageEtSignes(image)
  verifier(resultat)
  const classes = resultat.predictions.detections.map((d) => `${d.classe} ${(d.confiance * 100).toFixed(0)} %`)
  console.log(
    `OK image seule (${Math.round(performance.now() - t)} ms) — sorties : ${Object.keys(resultat).join(', ')} ; ` +
      `${classes.length} détection(s)${classes.length ? ' : ' + classes.join(', ') : ''}`,
  )

  // Cache : même image → aucun nouvel appel.
  const avant = requetes
  t = performance.now()
  verifier(await detecterMainsVisageEtSignes(image))
  assert.equal(requetes, avant, 'le 2e appel sur la même image ne devrait pas refaire de requête')
  console.log(`OK cache (${Math.round(performance.now() - t)} ms, 0 requête)`)

  // Lot : image en cache + image nouvelle + doublon → 1 seule requête, résultats dans l'ordre.
  const avantLot = requetes
  t = performance.now()
  const lot = await detecterMainsVisageEtSignesLot([image, image2, image2], { cache: true })
  assert.equal(lot.length, 3)
  lot.forEach(verifier)
  assert.equal(requetes - avantLot, 1, `1 requête attendue pour le lot, ${requetes - avantLot} faite(s)`)
  console.log(`OK lot de 3 (dont 1 en cache, 1 doublon) en ${Math.round(performance.now() - t)} ms, 1 requête`)

  // Seuil de confiance : jamais de détection sous le seuil.
  const filtre = await detecterMainsVisageEtSignes(image, { confianceMin: 0.99 })
  assert.ok(filtre.predictions.detections.every((d) => d.confiance >= 0.99))
  console.log('OK seuil de confiance')
} catch (e) {
  if (e instanceof ErreurRoboflow) {
    console.error(`ÉCHEC (${e.code}${e.statut ? `, HTTP ${e.statut}` : ''}) : ${e.message}`)
  } else {
    console.error('ÉCHEC :', e instanceof Error ? e.message : e)
  }
  process.exit(1)
}

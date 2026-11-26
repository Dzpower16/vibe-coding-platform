// Test de fumée du workflow Roboflow (lib/roboflow/workflow.ts).
// Usage : pnpm smoke:roboflow [chemin/image.jpg]   — exige ROBOFLOW_API_KEY dans l'environnement.
// Par défaut, une mire générée (aucune personne filmée) : on vérifie la forme de la réponse, pas la détection.
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'
import { detecterMainsVisageEtSignes, ErreurRoboflow } from '../lib/roboflow/workflow.ts'

const chemin = process.argv[2] ?? fileURLToPath(new URL('./fixtures/mire-test.jpg', import.meta.url))
const image = { type: 'base64', value: (await readFile(chemin)).toString('base64') }

try {
  const resultat = await detecterMainsVisageEtSignes(image)
  // Sortie déclarée par le workflow « lsq-mains-visage-et-signes-logic » : predictions (détections).
  assert.ok('predictions' in resultat, `sortie « predictions » absente (reçu : ${Object.keys(resultat).join(', ') || 'rien'})`)
  assert.equal(resultat.predictions.type, 'detections', 'la sortie « predictions » devrait contenir des détections')
  assert.ok(Array.isArray(resultat.predictions.detections))
  const classes = resultat.predictions.detections.map((d) => `${d.classe} ${(d.confiance * 100).toFixed(0)} %`)
  console.log(`OK — sorties : ${Object.keys(resultat).join(', ')} ; ${classes.length} détection(s)${classes.length ? ' : ' + classes.join(', ') : ''}`)
} catch (e) {
  if (e instanceof ErreurRoboflow) {
    console.error(`ÉCHEC (${e.code}${e.statut ? `, HTTP ${e.statut}` : ''}) : ${e.message}`)
  } else {
    console.error('ÉCHEC :', e instanceof Error ? e.message : e)
  }
  process.exit(1)
}

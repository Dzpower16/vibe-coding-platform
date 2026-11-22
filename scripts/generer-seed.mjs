// Génère supabase/seed.sql et lib/categories.ts à partir de data/signes-depart.json.
// Usage : pnpm seed:sql   (le seed fait un upsert sur `glose` : il peut être relancé).
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const racine = join(dirname(fileURLToPath(import.meta.url)), '..')
const data = JSON.parse(readFileSync(join(racine, 'data', 'signes-depart.json'), 'utf8'))

const GLOSE = /^[A-Z0-9]+(-[A-Z0-9]+)*$/
const erreurs = []
const vues = new Map()
const motsVus = new Map()
const lignes = []

for (const cat of data.categories) {
  if (!['signe', 'lettre', 'chiffre'].includes(cat.type)) erreurs.push(`type invalide : ${cat.id}`)
  for (const s of cat.signes) {
    if (!GLOSE.test(s.glose)) erreurs.push(`glose invalide : ${s.glose}`)
    if (vues.has(s.glose)) erreurs.push(`glose en double : ${s.glose}`)
    vues.set(s.glose, cat.id)
    if (![1, 2, 3].includes(s.p)) erreurs.push(`priorité invalide : ${s.glose}`)
    if (!Array.isArray(s.fr) || s.fr.length === 0) erreurs.push(`mots français manquants : ${s.glose}`)
    for (const m of s.fr) {
      const cle = m.toLowerCase()
      motsVus.set(cle, [...(motsVus.get(cle) ?? []), s.glose])
    }
    lignes.push({ ...s, categorie: cat.id, type: cat.type })
  }
}

if (erreurs.length) {
  console.error(erreurs.join('\n'))
  process.exit(1)
}
for (const [mot, gloses] of motsVus) {
  if (gloses.length > 1) console.warn(`(info) « ${mot} » mène à plusieurs gloses : ${gloses.join(', ')}`)
}

const q = (v) => (v == null ? 'null' : `'${String(v).replaceAll("'", "''")}'`)
const tableau = (arr) => `array[${arr.map(q).join(', ')}]::text[]`

const valeurs = lignes
  .map((s) => `  (${q(s.glose)}, ${tableau(s.fr)}, ${q(s.categorie)}, '${s.type}', ${s.p}, ${q(s.notes)})`)
  .join(',\n')

const sql = `-- GÉNÉRÉ par scripts/generer-seed.mjs depuis data/signes-depart.json — ne pas éditer à la main.
-- ${lignes.length} signes. Exécuter après les migrations. Relançable (upsert sur glose).
insert into public.signes (glose, mots_fr, categorie, type, priorite, notes) values
${valeurs}
on conflict (glose) do update set
  mots_fr = excluded.mots_fr,
  categorie = excluded.categorie,
  type = excluded.type,
  priorite = excluded.priorite,
  notes = excluded.notes;
`
writeFileSync(join(racine, 'supabase', 'seed.sql'), sql)

const categoriesTs = `// GÉNÉRÉ par scripts/generer-seed.mjs — ne pas éditer à la main.
export const CATEGORIES = ${JSON.stringify(
  data.categories.map((c) => ({ id: c.id, nom: c.nom })),
  null,
  2,
)} as const

export function nomCategorie(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.nom ?? id
}
`
writeFileSync(join(racine, 'lib', 'categories.ts'), categoriesTs)

const parP = [1, 2, 3].map((p) => `p${p}=${lignes.filter((s) => s.p === p).length}`).join(' ')
console.log(`seed.sql : ${lignes.length} signes (${parP}), ${data.categories.length} catégories`)

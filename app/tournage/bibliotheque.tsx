'use client'

import dynamic from 'next/dynamic'
import { useMemo, useState } from 'react'
import { CATEGORIES, nomCategorie } from '@/lib/categories'
import type { MainDominante, MesPrises, Signe } from '@/lib/types'

// MediaPipe ne s'exécute que dans le navigateur.
const Studio = dynamic(() => import('./studio').then((m) => m.Studio), {
  ssr: false,
  loading: () => <p className="p-6 text-doux">Ouverture du studio…</p>,
})

const normaliser = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

export function Bibliotheque({
  signes,
  mesPrisesInitiales,
  userId,
  consentementId,
  mainDominante,
}: {
  signes: Signe[]
  mesPrisesInitiales: MesPrises
  userId: string
  consentementId: string
  mainDominante: MainDominante
}) {
  const [mesPrises, setMesPrises] = useState(mesPrisesInitiales)
  const [categorie, setCategorie] = useState('')
  const [recherche, setRecherche] = useState('')
  const [aFilmer, setAFilmer] = useState(true)
  const [priorite, setPriorite] = useState(0)
  const [selection, setSelection] = useState<Signe | null>(null)

  const filtres = useMemo(() => {
    const q = normaliser(recherche.trim())
    return signes.filter(
      (s) =>
        (!categorie || s.categorie === categorie) &&
        (!priorite || s.priorite === priorite) &&
        (!aFilmer || !mesPrises[s.id]) &&
        (!q || normaliser(s.glose).includes(q) || s.mots_fr.some((m) => normaliser(m).includes(q)) ||
          (!!s.definition && normaliser(s.definition).includes(q))),
    )
  }, [signes, categorie, priorite, aFilmer, recherche, mesPrises])

  const nbFilmes = signes.filter((s) => mesPrises[s.id]).length

  function suivant(apres: Signe) {
    // Prochain signe de la liste filtrée qui n'est pas encore filmé.
    const i = filtres.findIndex((s) => s.id === apres.id)
    const reste = [...filtres.slice(i + 1), ...filtres.slice(0, Math.max(0, i))]
    setSelection(reste.find((s) => s.id !== apres.id && !mesPrises[s.id]) ?? null)
  }

  function priseEnvoyee(signe: Signe) {
    setMesPrises((p) => ({
      ...p,
      [signe.id]: { total: (p[signe.id]?.total ?? 0) + 1, valides: p[signe.id]?.valides ?? 0 },
    }))
  }

  const champ = 'min-h-11 rounded-lg border border-ligne bg-carte px-3'

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      <section aria-label="Liste des signes" className={`space-y-3 ${selection ? 'hidden lg:block' : ''}`}>
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>
              <strong>{nbFilmes}</strong> / {signes.length} signes filmés
            </span>
            <span className="text-doux">{Math.round((nbFilmes / signes.length) * 100)} %</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-ligne" aria-hidden>
            <div className="h-full bg-ok" style={{ width: `${(nbFilmes / signes.length) * 100}%` }} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <input
            type="search"
            placeholder="🔎 Chercher un mot"
            aria-label="Chercher un mot"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className={`${champ} col-span-2`}
          />
          <select aria-label="Catégorie" value={categorie} onChange={(e) => setCategorie(e.target.value)} className={champ}>
            <option value="">Toutes les catégories</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
              </option>
            ))}
          </select>
          <select aria-label="Priorité" value={priorite} onChange={(e) => setPriorite(Number(e.target.value))} className={champ}>
            <option value={0}>Toutes priorités</option>
            <option value={1}>★★★ Essentiels</option>
            <option value={2}>★★ Courants</option>
            <option value={3}>★ Utiles</option>
          </select>
          <label className="col-span-2 flex min-h-11 items-center gap-2">
            <input type="checkbox" className="size-5" checked={aFilmer} onChange={(e) => setAFilmer(e.target.checked)} />
            Seulement ceux que je n’ai pas encore filmés
          </label>
        </div>

        <p className="text-sm text-doux" aria-live="polite">
          {filtres.length} signe{filtres.length > 1 ? 's' : ''}
        </p>
        <ul className="grid max-h-[65dvh] grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
          {filtres.map((s) => {
            const prises = mesPrises[s.id]
            const actif = selection?.id === s.id
            return (
              <li key={s.id}>
                <button
                  onClick={() => setSelection(s)}
                  aria-current={actif}
                  className={`flex h-full w-full flex-col items-start gap-1 rounded-xl border-2 bg-carte p-3 text-left transition ${
                    actif ? 'border-accent' : 'border-ligne hover:border-accent/50'
                  }`}
                >
                  <span className="flex w-full items-center justify-between gap-1">
                    <span className="truncate font-bold">{s.glose}</span>
                    {prises && (
                      <span className="shrink-0 rounded-full bg-ok/15 px-2 text-xs font-semibold text-ok" title="Mes prises">
                        ✓ {prises.total}
                      </span>
                    )}
                  </span>
                  <span className="line-clamp-2 text-sm text-doux">{s.mots_fr.join(', ')}</span>
                  <span className="text-xs text-doux">{nomCategorie(s.categorie)}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      <section aria-label="Studio de tournage" className={selection ? '' : 'hidden lg:block'}>
        {selection ? (
          <Studio
            signe={selection}
            userId={userId}
            consentementId={consentementId}
            mainDominante={mainDominante}
            nbPrises={mesPrises[selection.id]?.total ?? 0}
            onEnvoye={() => priseEnvoyee(selection)}
            onSuivant={() => suivant(selection)}
            onFermer={() => setSelection(null)}
          />
        ) : (
          <div className="flex h-full min-h-64 items-center justify-center rounded-2xl border-2 border-dashed border-ligne p-6 text-center text-doux">
            👈 Choisissez un signe dans la liste pour ouvrir le studio.
          </div>
        )}
      </section>
    </div>
  )
}

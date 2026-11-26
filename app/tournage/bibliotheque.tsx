'use client'

import dynamic from 'next/dynamic'
import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { prechargerIA } from '@/lib/mediapipe/holistic'
import { CATEGORIES } from '@/lib/categories'
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
  // La saisie reste fluide : le filtrage des ~800 signes suit avec un léger différé.
  const rechercheDifferee = useDeferredValue(recherche)
  // On affiche les signes par paquets : une page de 800 cartes est trop longue sur téléphone.
  const PAQUET = 60
  const [limite, setLimite] = useState(PAQUET)
  const [cleFiltres, setCleFiltres] = useState('')
  const cle = `${categorie}|${priorite}|${aFilmer}|${rechercheDifferee}`
  if (cle !== cleFiltres) {
    setCleFiltres(cle)
    setLimite(PAQUET)
  }

  // Texte de recherche normalisé une seule fois par signe (pas à chaque frappe).
  const index = useMemo(
    () => new Map(signes.map((s) => [s.id, normaliser([s.glose, ...s.mots_fr, s.definition ?? ''].join(' '))])),
    [signes],
  )

  // Pendant qu'on choisit un signe, le modèle de détection se télécharge en arrière-plan :
  // le studio s'ouvre ensuite presque instantanément.
  useEffect(() => {
    const id = window.setTimeout(prechargerIA, 1500)
    return () => window.clearTimeout(id)
  }, [])

  const filtres = useMemo(() => {
    const q = normaliser(rechercheDifferee.trim())
    return signes.filter(
      (s) =>
        (!categorie || s.categorie === categorie) &&
        (!priorite || s.priorite === priorite) &&
        (!aFilmer || !mesPrises[s.id]) &&
        (!q || index.get(s.id)!.includes(q)),
    )
  }, [signes, index, categorie, priorite, aFilmer, rechercheDifferee, mesPrises])

  const nbFilmes = useMemo(() => signes.filter((s) => mesPrises[s.id]).length, [signes, mesPrises])

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

  function choisir(s: Signe) {
    setSelection(s)
    // Sur téléphone, le studio remplace la liste : on remonte en haut de l'écran.
    if (window.matchMedia('(max-width: 1023px)').matches) window.scrollTo({ top: 0 })
  }

  const puce = (actif: boolean) =>
    `shrink-0 min-h-11 rounded-full border-2 px-4 text-sm font-semibold transition ${
      actif ? 'border-accent bg-accent text-white' : 'border-ligne bg-carte text-encre hover:border-accent/50'
    }`
  const pourcent = Math.round((nbFilmes / signes.length) * 100)

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      <section aria-label="Liste des signes" className={`min-w-0 space-y-4 ${selection ? 'hidden lg:block' : ''}`}>
        <div className="carte space-y-2 p-4">
          <div className="flex items-baseline justify-between gap-2">
            <p>
              <span className="text-2xl font-black">{nbFilmes}</span>
              <span className="text-doux"> / {signes.length} signes filmés</span>
            </p>
            <span className="pastille bg-ok-doux text-ok">{pourcent} %</span>
          </div>
          <div
            className="h-2.5 overflow-hidden rounded-full bg-ligne"
            role="progressbar"
            aria-label="Signes filmés"
            aria-valuemin={0}
            aria-valuemax={signes.length}
            aria-valuenow={nbFilmes}
          >
            <div className="h-full rounded-full bg-ok transition-[width]" style={{ width: `${Math.max(nbFilmes ? 1.5 : 0, (nbFilmes / signes.length) * 100)}%` }} />
          </div>
        </div>

        <div className="space-y-3">
          <input
            type="search"
            placeholder="🔎 Chercher un mot (ex. maison, merci…)"
            aria-label="Chercher un mot"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className="champ"
          />

          <div role="group" aria-label="Catégorie" className="defilement-discret -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0">
            <button type="button" aria-pressed={!categorie} onClick={() => setCategorie('')} className={puce(!categorie)}>
              Toutes
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={categorie === c.id}
                onClick={() => setCategorie(categorie === c.id ? '' : c.id)}
                className={puce(categorie === c.id)}
              >
                {c.nom}
              </button>
            ))}
          </div>

          <div>
            <div role="group" aria-label="Priorité" className="defilement-discret -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0">
              {(
                [
                  [0, 'Tous'],
                  [1, '★★★ Essentiels'],
                  [2, '★★ Courants'],
                  [3, '★ Utiles'],
                ] as const
              ).map(([v, libelle]) => (
                <button key={v} type="button" aria-pressed={priorite === v} onClick={() => setPriorite(v)} className={puce(priorite === v)}>
                  {libelle}
                </button>
              ))}
            </div>
          </div>
          <label className="flex min-h-11 cursor-pointer items-center gap-3 font-medium">
            <input type="checkbox" className="size-6 accent-accent" checked={aFilmer} onChange={(e) => setAFilmer(e.target.checked)} />
            Seulement ceux que je n’ai pas encore filmés
          </label>
        </div>

        <p className="text-sm font-medium text-doux" aria-live="polite">
          {filtres.length} signe{filtres.length > 1 ? 's' : ''}
        </p>

        {filtres.length === 0 ? (
          <div className="carte space-y-3 p-6 text-center">
            <p aria-hidden className="text-4xl">{aFilmer && !recherche ? '🎉' : '🔎'}</p>
            <p className="font-semibold">
              {aFilmer && !recherche ? 'Vous avez filmé tous les signes de ce filtre. Merci !' : 'Aucun signe ne correspond.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setRecherche('')
                setCategorie('')
                setPriorite(0)
              }}
              className="bouton bouton-secondaire"
            >
              Effacer les filtres
            </button>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:max-h-[70dvh] lg:grid-cols-2 lg:overflow-y-auto lg:pr-1 xl:grid-cols-3">
            {filtres.slice(0, limite).map((s) => {
              const prises = mesPrises[s.id]
              const actif = selection?.id === s.id
              const mot = s.mots_fr[0] ?? s.glose
              return (
                <li key={s.id} className="[contain-intrinsic-size:auto_7rem] [content-visibility:auto]">
                  <button
                    onClick={() => choisir(s)}
                    aria-current={actif}
                    className={`flex h-full w-full flex-col items-start gap-1.5 rounded-2xl border-2 bg-carte p-3 text-left transition ${
                      actif ? 'border-accent shadow-md' : 'border-ligne hover:border-accent/50'
                    }`}
                  >
                    <span className="flex w-full items-start justify-between gap-1">
                      <span className="min-w-0 break-words text-lg font-bold leading-tight first-letter:uppercase">{mot}</span>
                      {prises && (
                        <span className="pastille shrink-0 bg-ok-doux text-ok" title="Mes prises">
                          ✓ {prises.total}
                        </span>
                      )}
                    </span>
                    {s.mots_fr.length > 1 && <span className="line-clamp-1 text-sm text-doux">{s.mots_fr.slice(1).join(', ')}</span>}
                    <span className="mt-auto flex w-full flex-wrap items-center justify-between gap-1 pt-1">
                      <span className="glose">{s.glose}</span>
                      <span className="text-xs text-attention" aria-label={`priorité ${4 - s.priorite} sur 3`}>
                        {'★'.repeat(4 - s.priorite)}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
        {filtres.length > limite && (
          <button type="button" onClick={() => setLimite((l) => l + PAQUET)} className="bouton bouton-secondaire w-full">
            Voir plus de signes ({filtres.length - limite} restants)
          </button>
        )}
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
          <div className="flex h-full min-h-64 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ligne p-6 text-center text-doux">
            <span aria-hidden className="text-5xl">🎬</span>
            <p className="text-lg font-semibold text-encre">Choisissez un signe à gauche</p>
            <p>Le studio s’ouvre ici, avec la caméra et le compte à rebours.</p>
          </div>
        )}
      </section>
    </div>
  )
}

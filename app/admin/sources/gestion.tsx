'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseNavigateur } from '@/lib/supabase/client'
import type { SourceExterne } from '@/lib/types'

const champ = 'w-full min-h-11 rounded-lg border border-ligne bg-carte px-3'
const MIMES_PREUVE = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'text/plain']

const PORTEES = [
  { cle: 'portee_application', libelle: 'Montrer les signes dans l’application (Parler → signes)' },
  { cle: 'portee_reconnaissance', libelle: 'Entraîner la reconnaissance (Signer → voix, IA)' },
  { cle: 'portee_commercial', libelle: 'Usage commercial (application payante)' },
] as const

type ClePortee = (typeof PORTEES)[number]['cle']

export function GestionSources({ userId, sources }: { userId: string; sources: SourceExterne[] }) {
  const router = useRouter()
  const supabase = supabaseNavigateur()
  const [ouvert, setOuvert] = useState(sources.length === 0)
  const [occupe, setOccupe] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'erreur'; texte: string } | null>(null)

  const [titulaire, setTitulaire] = useState('')
  const [contact, setContact] = useState('')
  const [personnes, setPersonnes] = useState('')
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')
  const [portees, setPortees] = useState<Record<ClePortee, boolean>>({
    portee_application: false,
    portee_reconnaissance: false,
    portee_commercial: false,
  })
  const [credit, setCredit] = useState(false)
  const [creditNom, setCreditNom] = useState('')
  const [mineurs, setMineurs] = useState(false)
  const [parental, setParental] = useState(false)
  const [dateAccord, setDateAccord] = useState(new Date().toISOString().slice(0, 10))
  const [preuve, setPreuve] = useState<File | null>(null)
  const [preuveNote, setPreuveNote] = useState('')

  const peutEnregistrer =
    titulaire.trim().length >= 2 &&
    personnes.trim().length >= 2 &&
    (portees.portee_application || portees.portee_reconnaissance) &&
    (!mineurs || parental) &&
    (!!preuve || preuveNote.trim().length > 0) &&
    !!dateAccord

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault()
    setOccupe(true)
    setMessage(null)
    const id = crypto.randomUUID()
    let preuvePath: string | null = null
    try {
      if (preuve) {
        if (!MIMES_PREUVE.includes(preuve.type)) throw new Error('format de preuve accepté : PDF, image ou texte')
        const nom = preuve.name.replace(/[^\w.\-]+/g, '_').slice(-80)
        preuvePath = `${id}/${nom}`
        const { error } = await supabase.storage.from('preuves-accords').upload(preuvePath, preuve, { contentType: preuve.type })
        if (error) throw new Error(`preuve : ${error.message}`)
      }
      const { error } = await supabase.from('sources_externes').insert({
        id,
        titulaire: titulaire.trim(),
        contact: contact.trim() || null,
        personnes_filmees: personnes.trim(),
        url_origine: url.trim() || null,
        description: description.trim() || null,
        ...portees,
        credit_public: credit,
        credit_nom: credit ? creditNom.trim() || titulaire.trim() : null,
        mineurs,
        accord_parental: mineurs ? parental : false,
        preuve_path: preuvePath,
        preuve_note: preuveNote.trim() || null,
        date_accord: dateAccord,
        cree_par: userId,
      })
      if (error) {
        if (preuvePath) await supabase.storage.from('preuves-accords').remove([preuvePath])
        throw new Error(error.message)
      }
      setMessage({ type: 'ok', texte: 'Accord enregistré.' })
      setOuvert(false)
      router.refresh()
    } catch (err) {
      setMessage({ type: 'erreur', texte: `Échec : ${err instanceof Error ? err.message : err}` })
    } finally {
      setOccupe(false)
    }
  }

  async function voirPreuve(path: string) {
    const { data, error } = await supabase.storage.from('preuves-accords').createSignedUrl(path, 120)
    if (error || !data) setMessage({ type: 'erreur', texte: 'Preuve introuvable.' })
    else window.open(data.signedUrl, '_blank', 'noopener')
  }

  async function revoquer(s: SourceExterne) {
    if (!window.confirm(`Retirer l’accord de « ${s.titulaire} » ? Ses vidéos sortiront immédiatement du lexique.`)) return
    const { error } = await supabase.from('sources_externes').update({ revoque_le: new Date().toISOString() }).eq('id', s.id)
    if (error) setMessage({ type: 'erreur', texte: error.message })
    else router.refresh()
  }

  return (
    <div className="space-y-6">
      {message && (
        <p role={message.type === 'erreur' ? 'alert' : 'status'} className={message.type === 'erreur' ? 'text-alerte' : 'text-ok'}>
          {message.texte}
        </p>
      )}

      {!ouvert ? (
        <button onClick={() => setOuvert(true)} className="min-h-12 rounded-lg bg-accent px-5 font-semibold text-white hover:bg-accent-fort">
          + Nouvel accord
        </button>
      ) : (
        <form onSubmit={enregistrer} className="grid gap-4 rounded-2xl border border-ligne bg-carte p-5 md:grid-cols-2">
          <label className="block space-y-1">
            <span className="text-sm font-medium">Titulaire des vidéos (personne ou organisme)</span>
            <input required value={titulaire} onChange={(e) => setTitulaire(e.target.value)} className={champ} />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Contact (courriel, réseau…)</span>
            <input value={contact} onChange={(e) => setContact(e.target.value)} className={champ} />
          </label>
          <label className="block space-y-1 md:col-span-2">
            <span className="text-sm font-medium">Personnes qui apparaissent dans les vidéos et ont donné leur accord</span>
            <input required value={personnes} onChange={(e) => setPersonnes(e.target.value)} className={champ} placeholder="Noms, séparés par des virgules" />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Lien d’origine (chaîne, vidéo)</span>
            <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} className={champ} placeholder="https://…" />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Date de l’accord</span>
            <input type="date" required value={dateAccord} onChange={(e) => setDateAccord(e.target.value)} className={champ} />
          </label>
          <label className="block space-y-1 md:col-span-2">
            <span className="text-sm font-medium">Vidéos concernées et conditions</span>
            <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-lg border border-ligne p-3" />
          </label>

          <fieldset className="space-y-2 md:col-span-2">
            <legend className="text-sm font-medium">Ce que l’accord permet (au moins une des deux premières cases)</legend>
            {PORTEES.map((p) => (
              <label key={p.cle} className="flex min-h-11 items-center gap-3">
                <input type="checkbox" className="size-5" checked={portees[p.cle]} onChange={(e) => setPortees((v) => ({ ...v, [p.cle]: e.target.checked }))} />
                {p.libelle}
              </label>
            ))}
            <label className="flex min-h-11 items-center gap-3">
              <input type="checkbox" className="size-5" checked={credit} onChange={(e) => setCredit(e.target.checked)} />
              Crédit public du nom
            </label>
            {credit && <input value={creditNom} onChange={(e) => setCreditNom(e.target.value)} className={champ} placeholder="Nom à afficher (par défaut : titulaire)" />}
          </fieldset>

          <fieldset className="space-y-2 rounded-lg border border-attention/40 bg-attention/10 p-3 md:col-span-2">
            <label className="flex min-h-11 items-center gap-3">
              <input type="checkbox" className="size-5" checked={mineurs} onChange={(e) => setMineurs(e.target.checked)} />
              Des personnes de moins de 14 ans apparaissent dans les vidéos
            </label>
            {mineurs && (
              <label className="flex min-h-11 items-center gap-3">
                <input type="checkbox" className="size-5" checked={parental} onChange={(e) => setParental(e.target.checked)} />
                J’ai l’accord écrit de leurs parents (obligatoire, Loi 25)
              </label>
            )}
          </fieldset>

          <label className="block space-y-1">
            <span className="text-sm font-medium">Preuve écrite (PDF, capture, texte)</span>
            <input type="file" accept={MIMES_PREUVE.join(',')} onChange={(e) => setPreuve(e.target.files?.[0] ?? null)} className="block w-full text-sm" />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Ou description de la preuve</span>
            <input value={preuveNote} onChange={(e) => setPreuveNote(e.target.value)} className={champ} placeholder="Ex. courriel du 26 nov. 2026, archivé" />
          </label>

          <div className="flex gap-2 md:col-span-2">
            <button disabled={!peutEnregistrer || occupe} className="min-h-12 rounded-lg bg-ok px-5 font-semibold text-white disabled:opacity-50">
              {occupe ? 'Enregistrement…' : 'Enregistrer l’accord'}
            </button>
            <button type="button" onClick={() => setOuvert(false)} className="min-h-12 rounded-lg border border-ligne px-5">
              Annuler
            </button>
          </div>
        </form>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-bold">Accords enregistrés ({sources.length})</h2>
        {sources.length === 0 ? (
          <p className="text-doux">Aucun accord pour l’instant.</p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {sources.map((s) => (
              <li key={s.id} className={`space-y-2 rounded-xl border bg-carte p-4 ${s.revoque_le ? 'border-alerte/40 opacity-70' : 'border-ligne'}`}>
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold">{s.titulaire}</p>
                  <span className={`shrink-0 rounded-full px-2 text-xs font-semibold ${s.revoque_le ? 'bg-alerte/15 text-alerte' : 'bg-ok/15 text-ok'}`}>
                    {s.revoque_le ? 'Retiré' : 'Actif'}
                  </span>
                </div>
                <p className="text-sm text-doux">Personnes filmées : {s.personnes_filmees}</p>
                <p className="text-sm">
                  {[s.portee_application && 'Application', s.portee_reconnaissance && 'IA', s.portee_commercial && 'Commercial'].filter(Boolean).join(' · ')}
                </p>
                <p className="text-xs text-doux">Accord du {s.date_accord}{s.url_origine ? ` · ${s.url_origine}` : ''}</p>
                <div className="flex flex-wrap gap-2">
                  {s.preuve_path && (
                    <button onClick={() => voirPreuve(s.preuve_path!)} className="min-h-10 rounded-lg border border-ligne px-3 text-sm">
                      Voir la preuve
                    </button>
                  )}
                  {!s.revoque_le && (
                    <button onClick={() => revoquer(s)} className="min-h-10 rounded-lg border border-alerte px-3 text-sm text-alerte">
                      Retirer l’accord
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

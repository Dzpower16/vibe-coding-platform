import Link from 'next/link'

const etapes = [
  { icone: '📱', titre: 'Posez le téléphone', texte: 'Face à la personne qui signe, la caméra voit les mains, les épaules et le visage.' },
  { icone: '✋', titre: 'Elle signe', texte: 'La détection des mains tourne sur le téléphone : l’image de la caméra n’est envoyée nulle part.' },
  { icone: '🔊', titre: 'Le mot s’affiche et se dit', texte: 'En grand à l’écran et à voix haute. En cas de doute : « ? », et rien n’est dit.' },
]

const garanties = [
  { icone: '🤟', titre: 'Filmé par des personnes sourdes', texte: 'Chaque signe vient d’une vraie personne sourde, puis est validé par la communauté.' },
  { icone: '🚫', titre: 'Aucun signe inventé', texte: 'Un mot qui n’a pas encore de signe filmé est épelé lettre par lettre, et c’est indiqué à l’écran.' },
  { icone: '✍️', titre: 'Consentement écrit', texte: 'Chaque personne filmée signe un consentement clair, qu’elle peut retirer en un clic.' },
]

const modules = [
  { href: '/parler', icone: '✋', titre: 'Signer → voix', texte: 'La caméra reconnaît un signe et le téléphone dit le mot.', etat: 'disponible' },
  { href: '/tournage', icone: '🎬', titre: 'Bibliothèque de signes', texte: 'Personnes sourdes : filmez les signes qui font vivre l’application.', etat: 'disponible' },
  { href: '/direct', icone: '🎙️', titre: 'Direct', texte: 'Quelqu’un parle français : les signes filmés s’enchaînent à l’écran.', etat: 'bientot' },
  { href: '/conversation', icone: '💬', titre: 'Face à face', texte: 'Un téléphone posé entre deux personnes, chacune de son côté.', etat: 'bientot' },
] as const

/** Aperçu de l'écran « Signer → voix » (illustration de l'interface, pas un signe). */
function ApercuApp() {
  return (
    <div aria-hidden className="mx-auto w-full max-w-[18rem] rounded-[2.5rem] border-[10px] border-encre bg-encre shadow-2xl">
      <div className="overflow-hidden rounded-[1.8rem] bg-fond">
        <div className="relative aspect-[4/3] bg-gradient-to-br from-slate-700 to-slate-900">
          <span className="absolute left-3 top-3 rounded-full bg-ok px-3 py-1 text-xs font-bold text-white">👀 J’observe</span>
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
            {['Visage', 'Épaules', 'Mains'].map((c) => (
              <span key={c} className="rounded-full bg-white/90 px-2 py-0.5 text-[0.65rem] font-bold text-ok">
                ✓ {c}
              </span>
            ))}
          </div>
        </div>
        <div className="space-y-2 p-3">
          <div className="carte p-3 text-center">
            <p className="text-3xl font-black tracking-tight">Bonjour</p>
            <p className="text-xs text-doux">🔊 dit à voix haute</p>
          </div>
          <div className="flex gap-2">
            <span className="flex-1 rounded-lg bg-encre py-2 text-center text-xs font-bold text-white">⏸ Pause</span>
            <span className="flex-1 rounded-lg border-2 border-encre/15 py-2 text-center text-xs font-bold">🔊 Voix</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Accueil() {
  return (
    <div className="space-y-14 sm:space-y-20">
      {/* Promesse */}
      <section className="grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-6">
          <p className="pastille bg-accent-doux text-accent">🤲 Français ↔ langue des signes québécoise</p>
          <h1 className="text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl">
            Se comprendre,
            <br />
            <span className="text-accent">entre nos mains.</span>
          </h1>
          <p className="max-w-xl text-lg text-doux sm:text-xl">
            Entre-Mains aide les personnes sourdes et entendantes à se parler, avec des signes de la LSQ{' '}
            <strong className="text-encre">filmés par des personnes sourdes</strong>. Jamais inventés.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/parler" prefetch={false} className="bouton bouton-primaire bouton-grand">
              ✋ Essayer Signer → voix
            </Link>
            <Link href="/tournage" prefetch={false} className="bouton bouton-secondaire bouton-grand">
              🎬 Filmer des signes
            </Link>
          </div>
          <p className="text-sm text-doux">Sur téléphone ou ordinateur, directement dans le navigateur. Installable sur l’écran d’accueil.</p>
        </div>
        <ApercuApp />
      </section>

      {/* Comment ça marche */}
      <section aria-labelledby="titre-etapes" className="space-y-6">
        <h2 id="titre-etapes" className="text-2xl font-bold sm:text-3xl">
          Comment ça marche
        </h2>
        <ol className="grid gap-4 sm:grid-cols-3">
          {etapes.map((e, i) => (
            <li key={e.titre} className="carte relative space-y-2 p-5">
              <span aria-hidden className="absolute right-4 top-4 text-sm font-black text-ligne">0{i + 1}</span>
              <span aria-hidden className="text-4xl">{e.icone}</span>
              <h3 className="text-lg font-bold">{e.titre}</h3>
              <p className="text-doux">{e.texte}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Modules */}
      <section aria-labelledby="titre-modules" className="space-y-6">
        <h2 id="titre-modules" className="text-2xl font-bold sm:text-3xl">
          Ce que vous pouvez faire
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {modules.map((m) => {
            const dispo = m.etat === 'disponible'
            return (
              <li key={m.href}>
                <Link
                  href={m.href}
                  prefetch={false}
                  className={`group flex h-full items-start gap-4 rounded-2xl border-2 p-5 transition ${
                    dispo ? 'border-ligne bg-carte hover:border-accent hover:shadow-md' : 'border-dashed border-ligne bg-transparent'
                  }`}
                >
                  <span aria-hidden className={`grid size-14 shrink-0 place-items-center rounded-2xl text-3xl ${dispo ? 'bg-accent-doux' : 'bg-ligne/60'}`}>
                    {m.icone}
                  </span>
                  <span className="min-w-0 space-y-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-xl font-bold">{m.titre}</span>
                      <span className={`pastille ${dispo ? 'bg-ok-doux text-ok' : 'bg-ligne text-doux'}`}>
                        {dispo ? '● Disponible' : 'Bientôt'}
                      </span>
                    </span>
                    <span className="block text-doux">{m.texte}</span>
                    {dispo && <span className="block pt-1 font-semibold text-accent group-hover:underline">Ouvrir →</span>}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </section>

      {/* Garanties */}
      <section aria-labelledby="titre-garanties" className="rounded-3xl bg-encre p-6 text-white sm:p-10">
        <h2 id="titre-garanties" className="text-2xl font-bold sm:text-3xl">
          Rien sur nous sans nous
        </h2>
        <p className="mt-2 max-w-2xl text-white/80">
          La LSQ est une langue à part entière. Les personnes sourdes sont les autrices de la bibliothèque et les juges
          de sa qualité.
        </p>
        <ul className="mt-6 grid gap-6 sm:grid-cols-3">
          {garanties.map((g) => (
            <li key={g.titre} className="space-y-2">
              <span aria-hidden className="text-3xl">{g.icone}</span>
              <h3 className="text-lg font-bold">{g.titre}</h3>
              <p className="text-white/80">{g.texte}</p>
            </li>
          ))}
        </ul>
      </section>

      <p className="rounded-2xl border-2 border-attention/30 bg-attention-doux p-4 text-attention sm:hidden">
        <strong>Important :</strong> Entre-Mains est une aide à la communication. Elle ne remplace pas un·e interprète
        professionnel·le (santé, justice, urgence).
      </p>
    </div>
  )
}

import Link from 'next/link'

const etapes = [
  {
    icone: '📱',
    titre: 'Posez le téléphone',
    texte: 'Face à la personne qui signe. La caméra repère le visage, les épaules et les mains.',
  },
  {
    icone: '✋',
    titre: 'La personne signe',
    texte: 'La détection tourne sur le téléphone : l’image de la caméra n’est envoyée nulle part.',
  },
  {
    icone: '🔊',
    titre: 'Le mot apparaît et se dit',
    texte: 'En grand à l’écran, et à voix haute. En cas de doute, un « ? » et le silence.',
  },
]

const garanties = [
  {
    icone: '🤟',
    titre: 'Filmé par des personnes sourdes',
    texte: 'Chaque signe vient d’une vraie personne sourde, puis il est validé par la communauté.',
  },
  {
    icone: '🔤',
    titre: 'Aucun signe inventé',
    texte: 'Un mot sans signe filmé est épelé lettre par lettre, et c’est clairement indiqué.',
  },
  {
    icone: '✍️',
    titre: 'Consentement écrit',
    texte: 'Chaque personne filmée signe un consentement clair, qu’elle retire en un clic.',
  },
]

const modules = [
  { href: '/parler', icone: '✋', titre: 'Signer → voix', texte: 'La caméra reconnaît un signe et le téléphone dit le mot.', dispo: true },
  { href: '/tournage', icone: '🎬', titre: 'Bibliothèque de signes', texte: 'Personnes sourdes : filmez les signes qui font vivre l’application.', dispo: true },
  { href: '/direct', icone: '🎙️', titre: 'Direct', texte: 'Quelqu’un parle français : les signes filmés s’enchaînent à l’écran.', dispo: false },
  { href: '/conversation', icone: '💬', titre: 'Face à face', texte: 'Un téléphone posé entre deux personnes, chacune de son côté.', dispo: false },
]

/** Carte flottante façon notification, autour de l'aperçu. */
function Bulle({ icone, titre, detail, className }: { icone: string; titre: string; detail: string; className: string }) {
  return (
    <div className={`absolute z-10 flex items-center gap-3 rounded-2xl border border-ligne/80 bg-carte/95 px-4 py-3 shadow-xl shadow-encre/5 backdrop-blur ${className}`}>
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent-doux text-lg">{icone}</span>
      <span className="text-left">
        <span className="block text-sm font-semibold text-encre">{titre}</span>
        <span className="block text-xs text-doux">{detail}</span>
      </span>
    </div>
  )
}

/** Aperçu de l'écran « Signer → voix » : une illustration de l'interface, pas un signe. */
function ApercuApp() {
  return (
    <div aria-hidden className="relative mx-auto w-full max-w-md px-6 pb-6 sm:px-16">
      <div className="absolute inset-x-10 top-10 -z-10 h-72 rounded-full bg-accent/15 blur-3xl" />
      <Bulle icone="✓" titre="Mains détectées" detail="Visage · épaules · mains" className="flotte -left-2 top-16 hidden sm:flex" />
      <Bulle icone="🔊" titre="« Bonjour »" detail="Dit à voix haute" className="flotte-lent -right-2 bottom-28 hidden sm:flex" />

      <div className="mx-auto w-full max-w-[17rem] rounded-[2.6rem] border-[9px] border-encre bg-encre shadow-2xl shadow-encre/25">
        <div className="overflow-hidden rounded-[1.9rem] bg-fond">
          <div className="relative aspect-[3/4] bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900">
            <span className="absolute left-3 top-3 rounded-full bg-ok px-3 py-1 text-xs font-bold text-white">👀 J’observe</span>
            {/* Repères de cadrage, comme dans l'app */}
            <div className="absolute inset-x-10 top-14 bottom-24 rounded-[2rem] border-2 border-dashed border-white/25" />
            {/* Silhouette tête et épaules (cadrage), sans geste */}
            <svg viewBox="0 0 200 200" className="absolute inset-x-0 bottom-10 mx-auto w-3/4 text-white/15" fill="currentColor">
              <circle cx="100" cy="70" r="34" />
              <path d="M30 200c0-44 31-72 70-72s70 28 70 72z" />
            </svg>
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
              <p className="font-serif text-3xl font-bold tracking-tight">Bonjour</p>
              <p className="text-xs text-doux">🔊 dit à voix haute</p>
            </div>
            <div className="flex gap-2">
              <span className="flex-1 rounded-lg bg-encre py-2 text-center text-xs font-bold text-white">⏸ Pause</span>
              <span className="flex-1 rounded-lg border-2 border-encre/15 py-2 text-center text-xs font-bold">🔊 Voix</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Accueil() {
  return (
    <div className="space-y-20 sm:space-y-28">
      {/* Promesse */}
      <section className="relative pt-4 text-center sm:pt-10">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-10 -z-10 mx-auto h-64 max-w-3xl rounded-full bg-gradient-to-r from-accent/10 via-indigo/10 to-accent/5 blur-3xl" />
        <p className="surtitre">Français ↔ langue des signes québécoise</p>
        <h1 className="titre mx-auto mt-5 max-w-4xl text-[2.6rem] leading-[1.08] sm:text-6xl md:text-7xl">
          Se comprendre,
          <br />
          <span className="degrade inline-block pb-1 pr-3 italic">entre nos mains.</span>
        </h1>
        <p className="texte-doux mx-auto mt-6 max-w-2xl text-lg sm:text-xl">
          Entre-Mains aide les personnes sourdes et entendantes à se parler, avec des signes de la LSQ filmés par des
          personnes sourdes. Jamais inventés.
        </p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/parler" prefetch={false} className="bouton bouton-brillant bouton-grand px-8">
            Essayer Signer → voix
          </Link>
          <Link href="/tournage" prefetch={false} className="bouton bouton-secondaire bouton-grand px-8">
            Filmer des signes
          </Link>
        </div>
        <p className="mt-5 text-sm text-doux">
          Filmé par des personnes sourdes <span aria-hidden>·</span> Aucun signe inventé <span aria-hidden>·</span>{' '}
          Consentement révocable
        </p>
        <div className="mt-14">
          <ApercuApp />
        </div>
      </section>

      {/* Comment ça marche */}
      <section aria-labelledby="titre-etapes">
        <div className="mx-auto max-w-2xl text-center">
          <p className="surtitre">Comment ça marche</p>
          <h2 id="titre-etapes" className="titre mt-4 text-3xl sm:text-4xl md:text-5xl">
            Trois gestes, et le téléphone parle.
          </h2>
          <p className="mt-4">
            <Link href="/guide" className="font-semibold text-accent hover:underline">
              Voir le guide complet →
            </Link>
          </p>
        </div>
        <ol className="mt-12 grid gap-5 sm:grid-cols-3">
          {etapes.map((e, i) => (
            <li key={e.titre} className="carte relative p-6 shadow-sm shadow-encre/[0.03]">
              <span aria-hidden className="absolute right-5 top-4 font-serif text-4xl font-bold text-ligne">
                {i + 1}
              </span>
              <span aria-hidden className="grid size-12 place-items-center rounded-2xl bg-accent-doux text-2xl">
                {e.icone}
              </span>
              <h3 className="titre mt-5 text-xl">{e.titre}</h3>
              <p className="texte-doux mt-2">{e.texte}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Modules */}
      <section aria-labelledby="titre-modules">
        <div className="mx-auto max-w-2xl text-center">
          <p className="surtitre">L’application</p>
          <h2 id="titre-modules" className="titre mt-4 text-3xl sm:text-4xl md:text-5xl">
            Ce que vous pouvez faire aujourd’hui.
          </h2>
        </div>
        <ul className="mt-12 grid gap-5 sm:grid-cols-2">
          {modules.map((m) => (
            <li key={m.href}>
              <Link
                href={m.href}
                prefetch={false}
                className={`group flex h-full items-start gap-5 rounded-3xl border p-6 transition ${
                  m.dispo
                    ? 'border-ligne bg-carte shadow-sm shadow-encre/[0.03] hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lg hover:shadow-accent/10'
                    : 'border-dashed border-ligne bg-transparent'
                }`}
              >
                <span aria-hidden className={`grid size-14 shrink-0 place-items-center rounded-2xl text-3xl ${m.dispo ? 'bg-accent-doux' : 'bg-ligne/60 grayscale'}`}>
                  {m.icone}
                </span>
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="titre text-xl">{m.titre}</span>
                    <span className={`pastille ${m.dispo ? 'bg-ok-doux text-ok' : 'bg-ligne text-doux'}`}>
                      {m.dispo ? '● Disponible' : 'Bientôt'}
                    </span>
                  </span>
                  <span className="texte-doux mt-1.5 block">{m.texte}</span>
                  {m.dispo && (
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-accent">
                      Ouvrir <span aria-hidden className="transition group-hover:translate-x-1">→</span>
                    </span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Garanties */}
      <section aria-labelledby="titre-garanties" className="relative overflow-hidden rounded-[2rem] bg-encre px-6 py-12 text-white sm:px-12 sm:py-16">
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-accent/30 blur-3xl" />
        <div className="relative max-w-2xl">
          <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-blue-300">Notre engagement</p>
          <h2 id="titre-garanties" className="mt-4 font-serif text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Rien sur nous sans nous.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-white/75">
            La LSQ est une langue à part entière. Les personnes sourdes sont les autrices de la bibliothèque et les
            juges de sa qualité.
          </p>
        </div>
        <ul className="relative mt-10 grid gap-8 sm:grid-cols-3">
          {garanties.map((g) => (
            <li key={g.titre}>
              <span aria-hidden className="grid size-12 place-items-center rounded-2xl bg-white/10 text-2xl">
                {g.icone}
              </span>
              <h3 className="mt-4 font-serif text-xl font-bold">{g.titre}</h3>
              <p className="mt-2 leading-relaxed text-white/75">{g.texte}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Appel final */}
      <section className="text-center">
        <h2 className="titre mx-auto max-w-2xl text-3xl sm:text-4xl">Chaque signe filmé rapproche deux personnes.</h2>
        <p className="texte-doux mx-auto mt-4 max-w-xl text-lg">
          Vous êtes sourd·e et vous signez en LSQ ? Votre façon de signer fait vivre l’application.
        </p>
        <Link href="/tournage" prefetch={false} className="bouton bouton-brillant bouton-grand mt-8 px-8">
          Contribuer à la bibliothèque
        </Link>
        <p className="mx-auto mt-10 max-w-xl rounded-2xl border border-attention/25 bg-attention-doux px-4 py-3 text-sm text-attention sm:hidden">
          <strong>Important :</strong> une aide à la communication, qui ne remplace pas un·e interprète professionnel·le
          (santé, justice, urgence).
        </p>
      </section>
    </div>
  )
}

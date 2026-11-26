import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Guide',
  description: 'Comment utiliser Entre-Mains : Signer → voix, filmer des signes, installer l’app, vie privée.',
}

type Etape = { icone: string; titre: string; texte: React.ReactNode }

const sommaire = [
  { id: 'decouvrir', libelle: 'Découvrir' },
  { id: 'parler', libelle: 'Signer → voix' },
  { id: 'filmer', libelle: 'Filmer des signes' },
  { id: 'installer', libelle: 'Installer l’app' },
  { id: 'vie-privee', libelle: 'Vie privée' },
  { id: 'questions', libelle: 'Questions' },
]

const etapesParler: Etape[] = [
  { icone: '🔑', titre: 'Connectez-vous', texte: 'Entrez votre courriel, puis touchez le lien reçu. Pas de mot de passe.' },
  { icone: '📱', titre: 'Posez le téléphone', texte: 'Face à la personne qui signe, à environ un mètre. On doit voir sa tête, ses épaules et ses mains.' },
  { icone: '▶️', titre: 'Touchez « Commencer »', texte: 'La pastille verte « J’observe » s’allume : l’app regarde.' },
  { icone: '✋', titre: 'Un signe à la fois', texte: 'La personne lève les mains, fait un signe, puis baisse les mains. La pastille devient rouge pendant le signe.' },
  { icone: '🔊', titre: 'Le mot s’affiche et se dit', texte: 'En grand à l’écran et à voix haute. Les mots s’ajoutent pour former une phrase, qu’on peut redire.' },
  { icone: '❓', titre: 'Un « ? » apparaît ?', texte: 'L’app n’est pas sûre : elle ne dit rien plutôt que de deviner. Refaites le signe plus lentement.' },
]

const etapesFilmer: Etape[] = [
  { icone: '🔑', titre: 'Connectez-vous', texte: 'Avec votre courriel. Une seule fois par appareil.' },
  { icone: '✍️', titre: 'Profil et consentement', texte: 'Votre nom, votre main dominante, puis le consentement écrit. Vous choisissez chaque usage, case par case.' },
  { icone: '🔎', titre: 'Choisissez un signe', texte: 'Cherchez un mot ou filtrez par catégorie. Commencez par les ★★★ Essentiels.' },
  { icone: '🎯', titre: 'Cadrez-vous', texte: 'Attendez que Visage, Épaules et Mains passent au vert ✓.' },
  { icone: '⏱️', titre: 'Touchez « Filmer »', texte: 'Un compte à rebours 3, 2, 1 s’affiche en grand. Mains baissées au départ.' },
  { icone: '🤟', titre: 'Signez une fois', texte: 'Comme vous le faites naturellement, puis baissez les mains : l’enregistrement s’arrête tout seul (8 secondes au maximum).' },
  { icone: '👀', titre: 'Revoyez votre prise', texte: 'Elle s’affiche telle que les autres la verront. Pas satisfait·e ? « Recommencer ».' },
  { icone: '✅', titre: 'Envoyez', texte: 'Chaque prise est vérifiée par la communauté sourde avant de servir dans l’app.' },
]

const conseils = [
  { icone: '💡', texte: 'Une bonne lumière devant vous, pas derrière (évitez la fenêtre dans le dos).' },
  { icone: '🧱', texte: 'Un fond uni et calme. Des vêtements unis, qui contrastent avec vos mains.' },
  { icone: '📐', texte: 'Le téléphone stable, à hauteur de poitrine. Toute la zone de signes dans l’image.' },
  { icone: '🔁', texte: 'Environ 5 prises par signe aident beaucoup la reconnaissance.' },
  { icone: '🗺️', texte: 'Votre variante régionale est la bienvenue : indiquez-la dans « Ajouter une précision ».' },
]

const questions: { q: string; r: React.ReactNode }[] = [
  {
    q: 'Est-ce que ça remplace un·e interprète ?',
    r: 'Non. Entre-Mains est une aide pour les échanges simples. Pour la santé, la justice, l’école ou une urgence, faites appel à un·e interprète professionnel·le.',
  },
  {
    q: 'Pourquoi l’app ne reconnaît-elle pas mon signe ?',
    r: 'Elle reconnaît seulement les signes déjà filmés en exemple, un à la fois. Plus il y a d’exemples et de personnes différentes, mieux elle fonctionne. Vos propres prises servent tout de suite pour vous (si vous avez coché la case « reconnaissance »).',
  },
  {
    q: 'Pourquoi un mot est-il épelé ?',
    r: 'Quand aucun signe n’a encore été filmé et validé pour un mot, l’app l’épelle avec l’alphabet LSQ plutôt que d’inventer un signe. C’est indiqué à l’écran.',
  },
  {
    q: 'La caméra envoie-t-elle mon image sur Internet ?',
    r: 'Dans « Signer → voix », non : la détection des mains se fait sur le téléphone. Dans la bibliothèque, seule la prise que vous choisissez d’envoyer est transmise, de façon privée.',
  },
  {
    q: 'Le premier chargement est long, c’est normal ?',
    r: 'Oui, la première fois l’app télécharge la détection des mains (environ 14 Mo). Une barre montre la progression. Ensuite, elle reste sur votre appareil et s’ouvre en quelques secondes.',
  },
  {
    q: 'Faut-il Internet ?',
    r: 'Oui, pour se connecter et charger les exemples de signes. Un réseau Wi-Fi est conseillé pour le premier chargement.',
  },
  {
    q: 'Quels appareils fonctionnent ?',
    r: 'Un téléphone, une tablette ou un ordinateur récents avec une caméra, dans Chrome, Edge, Safari ou Firefox à jour.',
  },
  {
    q: 'Puis-je retirer mes vidéos ?',
    r: (
      <>
        Oui, à tout moment : <Link href="/tournage/consentement" className="font-semibold text-accent underline">Profil et consentement</Link> →
        « Retirer mon consentement ». Vos vidéos cessent immédiatement d’être utilisées. La suppression complète des fichiers se
        fait sur demande auprès de l’équipe.
      </>
    ),
  },
]

function Section({ id, surtitre, titre, children }: { id: string; surtitre: string; titre: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`titre-${id}`} className="scroll-mt-24">
      <p className="surtitre">{surtitre}</p>
      <h2 id={`titre-${id}`} className="titre mt-3 text-3xl sm:text-4xl">
        {titre}
      </h2>
      <div className="mt-8">{children}</div>
    </section>
  )
}

function Etapes({ etapes }: { etapes: Etape[] }) {
  return (
    <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {etapes.map((e, i) => (
        <li key={e.titre} className="carte relative flex gap-4 p-5 shadow-sm shadow-encre/[0.03]">
          <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-2xl bg-accent-doux text-2xl">
            {e.icone}
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-bold text-accent">Étape {i + 1}</span>
            <span className="titre block text-lg">{e.titre}</span>
            <span className="texte-doux mt-1 block">{e.texte}</span>
          </span>
        </li>
      ))}
    </ol>
  )
}

export default function Guide() {
  return (
    <div className="space-y-20 sm:space-y-24">
      <header className="text-center">
        <p className="surtitre">Guide</p>
        <h1 className="titre mx-auto mt-4 max-w-3xl text-4xl leading-tight sm:text-6xl">
          Entre-Mains, <span className="degrade inline-block pr-2 italic">pas à pas.</span>
        </h1>
        <p className="texte-doux mx-auto mt-5 max-w-2xl text-lg sm:text-xl">
          Tout ce qu’il faut savoir en quelques minutes : se servir de l’app, filmer des signes, l’installer sur votre
          téléphone et protéger vos données.
        </p>
        <p className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full border border-dashed border-ligne px-4 py-1.5 text-sm text-doux">
          <span aria-hidden>🎬</span> Version en LSQ de ce guide : à venir, tournée avec la communauté sourde
        </p>
      </header>

      {/* Sommaire */}
      <nav aria-label="Sommaire du guide" className="defilement-discret -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:justify-center sm:px-0">
        {sommaire.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="inline-flex min-h-11 shrink-0 items-center rounded-full border-2 border-ligne bg-carte px-4 text-sm font-semibold transition hover:border-accent hover:text-accent"
          >
            {s.libelle}
          </a>
        ))}
      </nav>

      <Section id="decouvrir" surtitre="En 30 secondes" titre="Qu’est-ce qu’Entre-Mains ?">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icone: '🤝', titre: 'Pour se parler', texte: 'Une aide à la communication entre personnes sourdes qui signent en LSQ et personnes entendantes.' },
            { icone: '🤟', titre: 'Des vrais signes', texte: 'Tous les signes sont filmés par des personnes sourdes, puis validés. Aucun n’est inventé par l’ordinateur.' },
            { icone: '🌱', titre: 'Qui grandit avec vous', texte: 'Chaque signe filmé par la communauté rend l’app plus utile, pour tout le monde.' },
          ].map((c) => (
            <div key={c.titre} className="carte p-6">
              <span aria-hidden className="text-3xl">{c.icone}</span>
              <h3 className="titre mt-3 text-xl">{c.titre}</h3>
              <p className="texte-doux mt-1">{c.texte}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl bg-encre p-6 text-white">
            <p className="text-sm font-bold uppercase tracking-widest text-blue-300">Disponible</p>
            <p className="mt-2 font-serif text-2xl font-bold">✋ Signer → voix · 🎬 Bibliothèque</p>
            <p className="mt-2 text-white/75">La caméra reconnaît des signes et les dit à voix haute. La communauté filme les signes.</p>
          </div>
          <div className="rounded-3xl border-2 border-dashed border-ligne p-6">
            <p className="text-sm font-bold uppercase tracking-widest text-doux">Bientôt</p>
            <p className="titre mt-2 text-2xl">🎙️ Direct · 💬 Face à face</p>
            <p className="texte-doux mt-2">La parole en français devient une suite de signes filmés à l’écran.</p>
          </div>
        </div>
      </Section>

      <Section id="parler" surtitre="Pour les personnes entendantes et sourdes" titre="Utiliser « Signer → voix »">
        <Etapes etapes={etapesParler} />
        <div className="mt-6 flex flex-col items-start gap-4 rounded-3xl border border-accent/20 bg-accent-doux p-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl text-encre">
            <strong>Bon à savoir :</strong> l’app reconnaît des <strong>signes isolés</strong>, pas encore des phrases
            complètes. Elle apprend des exemples filmés par la communauté.
          </p>
          <Link href="/parler" prefetch={false} className="bouton bouton-brillant shrink-0">
            Essayer maintenant
          </Link>
        </div>
      </Section>

      <Section id="filmer" surtitre="Pour les personnes sourdes qui signent" titre="Filmer des signes pour la bibliothèque">
        <Etapes etapes={etapesFilmer} />
        <div className="mt-6 rounded-3xl border border-ligne bg-carte p-6 sm:p-8">
          <h3 className="titre text-2xl">Conseils pour une belle prise</h3>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2">
            {conseils.map((c) => (
              <li key={c.texte} className="flex items-start gap-3">
                <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-xl bg-fond text-xl">
                  {c.icone}
                </span>
                <span className="texte-doux pt-2">{c.texte}</span>
              </li>
            ))}
          </ul>
          <Link href="/tournage" prefetch={false} className="bouton bouton-brillant mt-7">
            Ouvrir la bibliothèque
          </Link>
        </div>
      </Section>

      <Section id="installer" surtitre="Comme une vraie app" titre="Installer Entre-Mains sur votre téléphone">
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              appareil: 'iPhone et iPad',
              icone: '🍎',
              etapes: ['Ouvrez entre-mains.vercel.app dans Safari.', 'Touchez le bouton Partager (le carré avec une flèche).', 'Choisissez « Sur l’écran d’accueil », puis « Ajouter ».'],
            },
            {
              appareil: 'Android',
              icone: '🤖',
              etapes: ['Ouvrez entre-mains.vercel.app dans Chrome.', 'Touchez le menu ⋮ en haut à droite.', 'Choisissez « Installer l’application » ou « Ajouter à l’écran d’accueil ».'],
            },
          ].map((a) => (
            <div key={a.appareil} className="carte p-6">
              <p className="flex items-center gap-3">
                <span aria-hidden className="text-3xl">{a.icone}</span>
                <span className="titre text-2xl">{a.appareil}</span>
              </p>
              <ol className="mt-4 space-y-3">
                {a.etapes.map((e, i) => (
                  <li key={e} className="flex gap-3">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-encre text-sm font-bold text-white">{i + 1}</span>
                    <span className="texte-doux pt-0.5">{e}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
        <p className="texte-doux mt-4 text-center">L’icône Entre-Mains apparaît sur votre écran d’accueil et s’ouvre en plein écran.</p>
      </Section>

      <Section id="vie-privee" surtitre="Vos données vous appartiennent" titre="Vie privée et consentement">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icone: '☑️', titre: 'Vous choisissez', texte: 'Chaque usage a sa propre case, aucune n’est cochée d’avance.' },
            { icone: '🔒', titre: 'Vidéos privées', texte: 'Elles ne sont jamais publiques et ne servent qu’aux usages que vous avez acceptés.' },
            { icone: '↩️', titre: 'Retrait en un clic', texte: 'Retirez votre consentement quand vous voulez : vos vidéos sortent de l’app.' },
            { icone: '🍁', titre: 'Au Canada', texte: 'Les données sont hébergées à Montréal. Aucune publicité, aucun pistage.' },
          ].map((c) => (
            <div key={c.titre} className="carte p-5">
              <span aria-hidden className="text-2xl">{c.icone}</span>
              <h3 className="titre mt-2 text-lg">{c.titre}</h3>
              <p className="texte-doux mt-1 text-sm">{c.texte}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="questions" surtitre="FAQ" titre="Questions fréquentes">
        <div className="space-y-3">
          {questions.map((q) => (
            <details key={q.q} className="carte group p-5 open:shadow-md">
              <summary className="flex min-h-8 cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold">
                {q.q}
                <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-fond text-accent transition group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="texte-doux mt-3">{q.r}</p>
            </details>
          ))}
        </div>
      </Section>

      <section className="rounded-[2rem] bg-encre px-6 py-12 text-center text-white sm:px-12">
        <h2 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">Prêt·e à essayer ?</h2>
        <p className="mx-auto mt-3 max-w-xl text-white/75">Quelques minutes suffisent pour filmer vos premiers signes ou essayer la reconnaissance.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/parler" prefetch={false} className="bouton bouton-grand bg-white px-8 text-encre hover:bg-accent-doux">
            Essayer Signer → voix
          </Link>
          <Link href="/tournage" prefetch={false} className="bouton bouton-grand border-2 border-white/30 px-8 text-white hover:border-white">
            Filmer des signes
          </Link>
        </div>
      </section>
    </div>
  )
}

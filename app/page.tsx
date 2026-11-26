import Link from 'next/link'

const sections = [
  {
    href: '/parler',
    titre: 'Signer → voix',
    texte: 'La caméra reconnaît un signe et le téléphone dit le mot à voix haute.',
    etat: 'Prototype',
  },
  {
    href: '/direct',
    titre: 'Direct',
    texte: 'Une personne parle français : les signes LSQ filmés s’enchaînent à l’écran.',
    etat: 'Bientôt',
  },
  {
    href: '/conversation',
    titre: 'Conversation',
    texte: 'Sur un téléphone posé entre deux personnes, face à face.',
    etat: 'Bientôt',
  },
  {
    href: '/tournage',
    titre: 'Bibliothèque de signes',
    texte: 'Personnes sourdes : filmez les signes qui alimentent l’application.',
    etat: 'Ouvert',
  },
]

export default function Accueil() {
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h1 className="text-3xl font-bold sm:text-4xl">Français ↔ LSQ, entre nos mains</h1>
        <p className="max-w-2xl text-lg text-doux">
          Entre-Mains montre en direct des signes de la langue des signes québécoise filmés par des
          personnes sourdes. Aucun signe n’est inventé : un mot sans signe filmé est épelé.
        </p>
        <p className="max-w-2xl text-sm text-doux">
          Outil d’aide à la communication — ne remplace pas un·e interprète professionnel·le.
        </p>
      </section>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {sections.map((s) => (
          <li key={s.href}>
            <Link
              href={s.href}
              prefetch={false}
              className="flex h-full flex-col gap-2 rounded-2xl border border-ligne bg-carte p-5 shadow-sm transition hover:border-accent"
            >
              <span className="text-xs font-semibold uppercase tracking-wide text-doux">{s.etat}</span>
              <span className="text-xl font-bold">{s.titre}</span>
              <span className="text-doux">{s.texte}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

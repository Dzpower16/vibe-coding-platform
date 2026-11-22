/**
 * Texte du consentement — source de vérité (CLAUDE.md §10).
 * Toute modification du texte = nouvelle CONSENTEMENT_VERSION ; les personnes déjà inscrites
 * devront re-signer avant de filmer à nouveau.
 */
export const CONSENTEMENT_VERSION = '2026-11-v1'

export const CONSENTEMENT_SECTIONS: { titre: string; paragraphes: string[] }[] = [
  {
    titre: 'Le projet',
    paragraphes: [
      "Entre-Mains est une application qui aide la communication entre personnes qui parlent français et personnes qui signent en langue des signes québécoise (LSQ). Elle montre, en direct, des vidéos de signes filmées par des personnes sourdes.",
      "Elle ne remplace pas un·e interprète professionnel·le.",
    ],
  },
  {
    titre: 'Ce que vous filmez',
    paragraphes: [
      "Vous filmez des signes, un par un, avec la caméra de votre appareil. Chaque vidéo montre votre visage, vos mains et le haut de votre corps.",
      "En même temps, l'application calcule des « positions » : des points qui décrivent la place de vos mains, de votre visage et de votre corps à chaque instant. Ces positions sont enregistrées avec la vidéo.",
    ],
  },
  {
    titre: 'Où vont vos données',
    paragraphes: [
      "Les vidéos et les positions sont stockées dans une base de données privée (Supabase). Elles ne sont jamais publiques : l'application les affiche seulement à travers des liens temporaires.",
      "Votre adresse courriel sert seulement à vous connecter. Nous ne vendons et ne partageons pas vos données.",
      "Une personne validatrice (sourde ou signante) peut regarder vos vidéos pour vérifier leur qualité avant qu'elles soient utilisées.",
    ],
  },
  {
    titre: 'Vos choix',
    paragraphes: [
      "Vous choisissez ci-dessous, case par case, à quoi vos vidéos peuvent servir. Seule la première case est nécessaire pour filmer.",
      "Vous pouvez retirer votre consentement à tout moment depuis cette page. Vos vidéos ne seront alors plus utilisées par l'application. Vous pouvez aussi demander la suppression complète de vos fichiers.",
    ],
  },
  {
    titre: 'Âge',
    paragraphes: ['Vous devez avoir 14 ans ou plus pour participer.'],
  },
]

export const PORTEES = [
  {
    cle: 'portee_application',
    obligatoire: true,
    libelle:
      "J'accepte que mes vidéos de signes soient montrées dans l'application Entre-Mains pour traduire du français vers la LSQ.",
  },
  {
    cle: 'portee_reconnaissance',
    obligatoire: false,
    libelle:
      "J'accepte que mes vidéos et positions servent à entraîner un outil qui reconnaît les signes (LSQ vers français).",
  },
  {
    cle: 'portee_avatar',
    obligatoire: false,
    libelle: "J'accepte que mes positions servent à animer un avatar 3D qui signe.",
  },
  {
    cle: 'portee_credit_public',
    obligatoire: false,
    libelle: "J'accepte que mon nom (ou nom affiché) soit mentionné publiquement comme contributeur·rice.",
  },
] as const

export type ClePortee = (typeof PORTEES)[number]['cle']

/** Texte intégral conservé avec la signature. */
export function texteConsentementComplet(): string {
  const corps = CONSENTEMENT_SECTIONS.map(
    (s) => `## ${s.titre}\n\n${s.paragraphes.join('\n\n')}`,
  ).join('\n\n')
  const portees = PORTEES.map((p) => `- ${p.libelle}${p.obligatoire ? ' (obligatoire)' : ''}`).join('\n')
  return `Consentement Entre-Mains — version ${CONSENTEMENT_VERSION}\n\n${corps}\n\n## Portées\n\n${portees}`
}

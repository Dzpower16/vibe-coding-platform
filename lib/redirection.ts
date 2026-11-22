/** N'accepte qu'un chemin interne (évite les redirections ouvertes). */
export function cheminSur(valeur: string | null | undefined, defaut = '/tournage'): string {
  if (!valeur || !valeur.startsWith('/') || valeur.startsWith('//') || valeur.includes('\\')) return defaut
  return valeur
}

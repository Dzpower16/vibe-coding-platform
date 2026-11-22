-- Entre-Mains — 0003 : restreindre les fonctions d'aide aux règles d'accès (RLS)
-- Les fonctions SECURITY DEFINER est_validateur() et a_consentement_actif() ne doivent pas être
-- appelables par les visiteurs anonymes (avertissement « anon_security_definer_function_executable »).
-- Les personnes connectées (authenticated) gardent EXECUTE : les politiques RLS en ont besoin.

revoke execute on function public.est_validateur() from public, anon;
revoke execute on function public.a_consentement_actif() from public, anon;
grant execute on function public.est_validateur() to authenticated;
grant execute on function public.a_consentement_actif() to authenticated;

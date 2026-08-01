REVOKE EXECUTE ON FUNCTION public.bootstrap_profile(text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.bootstrap_profile(text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.is_ativo(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_ativo(uuid) TO authenticated;

DROP POLICY IF EXISTS "Admin atualiza perfis" ON public.profiles;
CREATE POLICY "Admin atualiza perfis" ON public.profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin altera regras" ON public.config_regras;
CREATE POLICY "Admin altera regras" ON public.config_regras FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin aprova solicitacoes" ON public.solicitacoes_acesso;
CREATE POLICY "Admin aprova solicitacoes" ON public.solicitacoes_acesso FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
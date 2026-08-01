INSERT INTO public.profiles (id, nome, email, perfil, fator, palavra_chave, ativo)
SELECT u.id, 'Administrador', 'admin@bp.com', 'admin', 'palavra_chave', 'bp2024', true
FROM auth.users u WHERE u.email = 'admin@bp.com'
ON CONFLICT (id) DO UPDATE SET perfil = 'admin', ativo = true, fator = 'palavra_chave', palavra_chave = COALESCE(public.profiles.palavra_chave, 'bp2024');

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::app_role FROM auth.users u WHERE u.email = 'admin@bp.com'
ON CONFLICT (user_id, role) DO NOTHING;
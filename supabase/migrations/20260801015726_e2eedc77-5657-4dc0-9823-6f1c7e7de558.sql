-- ============ ROLES ============
create type public.app_role as enum ('admin','editor','visualizador');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "Usuarios veem seus papeis" on public.user_roles
for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

-- ============ PROFILES ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null default '',
  email text not null default '',
  perfil text not null default 'visualizador',
  fator text not null default 'palavra_chave',
  palavra_chave text,
  ip_permitido text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create or replace function public.is_ativo(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = _user_id and ativo)
$$;

create policy "Ver proprio perfil ou admin ve todos" on public.profiles
for select to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'admin'));

create policy "Admin cria perfis" on public.profiles
for insert to authenticated with check (public.has_role(auth.uid(),'admin'));

create policy "Admin atualiza perfis" on public.profiles
for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (true);

create policy "Admin exclui perfis" on public.profiles
for delete to authenticated using (public.has_role(auth.uid(),'admin') and id <> auth.uid());

-- Bootstrap: cria o perfil do usuario autenticado no primeiro acesso
create or replace function public.bootstrap_profile(_nome text default null)
returns public.profiles language plpgsql security definer set search_path = public as $$
declare
  v_email text;
  v_row public.profiles;
  v_primeiro boolean;
  v_perfil text;
begin
  if auth.uid() is null then raise exception 'nao autenticado'; end if;
  select p.* into v_row from public.profiles p where p.id = auth.uid();
  if found then return v_row; end if;

  select email into v_email from auth.users where id = auth.uid();
  select not exists (select 1 from public.profiles) into v_primeiro;
  v_perfil := case when v_primeiro or lower(coalesce(v_email,'')) = 'admin@bp.com' then 'admin' else 'visualizador' end;

  insert into public.profiles (id, nome, email, perfil, fator, ativo)
  values (auth.uid(), coalesce(nullif(_nome,''), split_part(coalesce(v_email,'usuario'),'@',1)), coalesce(v_email,''), v_perfil, 'palavra_chave', true)
  returning * into v_row;

  insert into public.user_roles (user_id, role) values (auth.uid(), v_perfil::public.app_role)
  on conflict do nothing;

  return v_row;
end $$;

-- Admin define papel de um usuario mantendo profiles.perfil em sincronia
create or replace function public.sync_role() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  delete from public.user_roles where user_id = NEW.id;
  insert into public.user_roles (user_id, role) values (NEW.id, NEW.perfil::public.app_role)
  on conflict do nothing;
  return NEW;
end $$;

create trigger profiles_sync_role
after insert or update of perfil on public.profiles
for each row execute function public.sync_role();

-- ============ SOLICITACOES DE ACESSO (fator autorizacao) ============
create table public.solicitacoes_acesso (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null default '',
  email text not null default '',
  status text not null default 'pendente',
  ip text,
  aprovado_por uuid,
  aprovado_em timestamptz,
  criado_em timestamptz not null default now()
);
grant select, insert, update, delete on public.solicitacoes_acesso to authenticated;
grant all on public.solicitacoes_acesso to service_role;
alter table public.solicitacoes_acesso enable row level security;

create policy "Ve proprias solicitacoes ou admin" on public.solicitacoes_acesso
for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "Cria propria solicitacao" on public.solicitacoes_acesso
for insert to authenticated with check (user_id = auth.uid());
create policy "Admin aprova solicitacoes" on public.solicitacoes_acesso
for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (true);
create policy "Admin exclui solicitacoes" on public.solicitacoes_acesso
for delete to authenticated using (public.has_role(auth.uid(),'admin'));

-- ============ CONFIG REGRAS ============
create table public.config_regras (
  id uuid primary key default gen_random_uuid(),
  dias_parado integer not null default 30,
  updated_at timestamptz not null default now()
);
grant select on public.config_regras to authenticated;
grant insert, update on public.config_regras to authenticated;
grant all on public.config_regras to service_role;
alter table public.config_regras enable row level security;

create policy "Autenticados leem regras" on public.config_regras
for select to authenticated using (true);
create policy "Admin cria regras" on public.config_regras
for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "Admin altera regras" on public.config_regras
for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (true);

insert into public.config_regras (dias_parado) values (30);

-- ============ AUDIT LOG ============
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  modulo text not null,
  record_id uuid not null,
  campo text not null,
  campo_label text not null,
  valor_antigo text,
  valor_novo text,
  acao text not null,
  usuario text not null default 'sistema',
  criado_em timestamptz not null default now()
);
create index audit_log_modulo_record_idx on public.audit_log (modulo, record_id, criado_em desc);
grant select on public.audit_log to authenticated;
grant all on public.audit_log to service_role;
alter table public.audit_log enable row level security;

create policy "Autenticados ativos leem historico" on public.audit_log
for select to authenticated using (public.is_ativo(auth.uid()));

-- ============ SINISTROS: CASCO ============
create table public.sinistros_casco_perda_parcial (
  id uuid primary key default gen_random_uuid(),
  numero text, status_star text, data_aviso date, data_registro_reabertura date,
  numero_processo text, numero_comunicado text, contratante text, numero_produto text,
  cobertura text, tipo_contratacao text, descricao_cobertura_servico text, nome_segurado text,
  cpf_cnpj text, data_nascimento date, placa text, obito text, causa text, covid text,
  valor_fipe_cobertura numeric, numero_apolice text, franquia numeric, data_contratacao_item date,
  data_sinistro date, tempo_coberto_dias numeric, terceiro text, nome_terceiro text,
  placa_terceiro text, abertura_realizada text, valor_avisado_sinistro numeric,
  reestimativa_positiva numeric, data_reestimativa_positiva date, reestimativa_negativa numeric,
  data_reestimativa_negativa date, tipo_processo text, valor_oficina_indenizacao numeric,
  data_pagamento_oficina_indenizacao date, valor_pecas_i numeric, data_pagamento_pecas_i date,
  valor_pecas_ii numeric, data_pagamento_pecas_ii date, complemento_pagamento numeric,
  data_pagamento_complemento date, valor_total_pago_processo numeric, valor_pendente numeric,
  data_finalizacao_star date, status_processo text, observacoes_processo text,
  created_at timestamptz not null default now(),
  created_by text not null default '',
  updated_at timestamptz not null default now(),
  updated_by text not null default ''
);
grant select, insert, update, delete on public.sinistros_casco_perda_parcial to authenticated;
grant all on public.sinistros_casco_perda_parcial to service_role;
alter table public.sinistros_casco_perda_parcial enable row level security;
create policy "Ativos leem casco" on public.sinistros_casco_perda_parcial for select to authenticated using (public.is_ativo(auth.uid()));
create policy "Ativos criam casco" on public.sinistros_casco_perda_parcial for insert to authenticated with check (public.is_ativo(auth.uid()));
create policy "Ativos editam casco" on public.sinistros_casco_perda_parcial for update to authenticated using (public.is_ativo(auth.uid())) with check (public.is_ativo(auth.uid()));
create policy "Ativos excluem casco" on public.sinistros_casco_perda_parcial for delete to authenticated using (public.is_ativo(auth.uid()));

-- ============ SINISTROS: INTEGRAL ============
create table public.sinistros_indenizacao_integral (
  id uuid primary key default gen_random_uuid(),
  numero text, status_star text, data_aviso date, data_registro date, numero_processo text,
  numero_comunicado text, contratante text, numero_produto text, cobertura text,
  tipo_contratacao text, descricao_cobertura_servico text, nome_segurado text, cpf_cnpj text,
  placa text, data_nascimento date, obito text, causa text, covid text, numero_apolice text,
  franquia numeric, data_contratacao_item date, data_sinistro date, tempo_coberto_dias numeric,
  terceiro text, nome_terceiro text, placa_terceiro text, abertura_realizada text,
  valor_fipe_cobertura numeric, desconto_premio numeric, desconto_desagio_contrato numeric,
  desconto_autuacao numeric, reavaliacao numeric, valor_total_sinistro numeric,
  reavaliacao_negativa numeric, data_reavaliacao date, reavaliacao_positiva numeric,
  data_reavaliacao_positiva date, tipo_processo text, tipo_processo_ii text,
  data_finalizacao_pag_neg date, valor_financiamento numeric, data_pagamento date,
  valor_residual_instantaneo numeric, data_pagamento_negativa date, valor_total_pago_negado numeric,
  valor_real_pago numeric, complemento_pagamento numeric, data_pagamento_cancelamento date,
  valor_pendente numeric, status_processo text, salvado text, status_salvado text,
  data_aviso_salvado date, valor_lancamento numeric, valor_venda numeric,
  data_recebimento_cancelamento date, reavaliacao_salvado numeric, data_reavaliacao_salvado date,
  created_at timestamptz not null default now(),
  created_by text not null default '',
  updated_at timestamptz not null default now(),
  updated_by text not null default ''
);
grant select, insert, update, delete on public.sinistros_indenizacao_integral to authenticated;
grant all on public.sinistros_indenizacao_integral to service_role;
alter table public.sinistros_indenizacao_integral enable row level security;
create policy "Ativos leem integral" on public.sinistros_indenizacao_integral for select to authenticated using (public.is_ativo(auth.uid()));
create policy "Ativos criam integral" on public.sinistros_indenizacao_integral for insert to authenticated with check (public.is_ativo(auth.uid()));
create policy "Ativos editam integral" on public.sinistros_indenizacao_integral for update to authenticated using (public.is_ativo(auth.uid())) with check (public.is_ativo(auth.uid()));
create policy "Ativos excluem integral" on public.sinistros_indenizacao_integral for delete to authenticated using (public.is_ativo(auth.uid()));

-- ============ CARIMBO DE USUARIO/DATA ============
create or replace function public.stamp_usuario() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_user text;
begin
  select coalesce(nullif(p.nome,''), p.email) into v_user from public.profiles p where p.id = auth.uid();
  v_user := coalesce(v_user, 'sistema');
  if tg_op = 'INSERT' then
    NEW.created_at := now(); NEW.created_by := v_user;
    NEW.updated_at := now(); NEW.updated_by := v_user;
  else
    NEW.created_at := OLD.created_at; NEW.created_by := OLD.created_by;
    NEW.updated_at := now(); NEW.updated_by := v_user;
  end if;
  return NEW;
end $$;

create trigger casco_stamp before insert or update on public.sinistros_casco_perda_parcial
for each row execute function public.stamp_usuario();
create trigger integral_stamp before insert or update on public.sinistros_indenizacao_integral
for each row execute function public.stamp_usuario();

-- ============ AUDITORIA AUTOMATICA ============
create or replace function public.registrar_auditoria() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_user text; v_modulo text := tg_argv[0];
  v_old jsonb; v_new jsonb; k text; ov text; nv text;
begin
  select coalesce(nullif(p.nome,''), p.email) into v_user from public.profiles p where p.id = auth.uid();
  v_user := coalesce(v_user, 'sistema');

  if tg_op = 'INSERT' then
    insert into public.audit_log (modulo, record_id, campo, campo_label, valor_antigo, valor_novo, acao, usuario)
    values (v_modulo, NEW.id, '_registro', 'Registro criado', null, coalesce(NEW.numero_processo,'—'), 'criacao', v_user);
    return NEW;
  elsif tg_op = 'DELETE' then
    insert into public.audit_log (modulo, record_id, campo, campo_label, valor_antigo, valor_novo, acao, usuario)
    values (v_modulo, OLD.id, '_registro', 'Registro excluído', coalesce(OLD.numero_processo,'—'), null, 'exclusao', v_user);
    return OLD;
  else
    v_old := to_jsonb(OLD); v_new := to_jsonb(NEW);
    for k in select jsonb_object_keys(v_new) loop
      if k in ('id','created_at','created_by','updated_at','updated_by') then continue; end if;
      ov := v_old->>k; nv := v_new->>k;
      if coalesce(ov,'') is distinct from coalesce(nv,'') then
        insert into public.audit_log (modulo, record_id, campo, campo_label, valor_antigo, valor_novo, acao, usuario)
        values (v_modulo, NEW.id, k, k, ov, nv, 'edicao', v_user);
      end if;
    end loop;
    return NEW;
  end if;
end $$;

create trigger casco_audit after insert or update or delete on public.sinistros_casco_perda_parcial
for each row execute function public.registrar_auditoria('casco');
create trigger integral_audit after insert or update or delete on public.sinistros_indenizacao_integral
for each row execute function public.registrar_auditoria('integral');
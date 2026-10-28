-- Install AFTER v003-player-data.sql. Does not expose individual scores.
begin;
create table if not exists public.atlas_provinces(code text primary key,name text not null,latitude double precision not null,longitude double precision not null);
insert into public.atlas_provinces values ('10','กรุงเทพมหานคร',13.76,100.50),('50','เชียงใหม่',18.79,98.98),('40','ขอนแก่น',16.44,102.84),('30','นครราชสีมา',14.98,102.10),('20','ชลบุรี',13.36,100.98),('90','สงขลา',7.20,100.59),('83','ภูเก็ต',7.88,98.39),('57','เชียงราย',19.91,99.83) on conflict (code) do nothing;
alter table public.atlas_provinces enable row level security;
revoke all on public.atlas_provinces from public,anon,authenticated;
grant select on public.atlas_provinces to anon,authenticated;
drop policy if exists atlas_province_read on public.atlas_provinces;
create policy atlas_province_read on public.atlas_provinces for select to anon,authenticated using(true);
create table if not exists public.atlas_player_region(player_id uuid primary key references auth.users(id) on delete cascade,province_code text not null references public.atlas_provinces(code),consent boolean not null default false,updated_at timestamptz not null default now());
alter table public.atlas_player_region enable row level security;
revoke all on public.atlas_player_region from public,anon,authenticated;
grant select on public.atlas_player_region to authenticated;
drop policy if exists atlas_own_region on public.atlas_player_region;
create policy atlas_own_region on public.atlas_player_region for select to authenticated using(player_id=(select auth.uid()));
create or replace function public.atlas_set_region(p_code text,p_consent boolean) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then raise exception 'Account required'; end if;
 if p_consent is null then raise exception 'Consent required';end if;
 insert into public.atlas_player_region(player_id,province_code,consent) values(auth.uid(),p_code,p_consent)
 on conflict(player_id) do update set province_code=excluded.province_code,consent=excluded.consent,updated_at=now();
end;$$;
revoke all on function public.atlas_set_region(text,boolean) from public,anon;
grant execute on function public.atlas_set_region(text,boolean) to authenticated;
create or replace function public.atlas_region_summary() returns table(province_code text,province_name text,latitude double precision,longitude double precision,players bigint,total_score numeric,safest bigint,decisions bigint,completed bigint)
language sql stable security definer set search_path='' as $$
 select p.code,p.name,p.latitude,p.longitude,count(*),sum(s.total_score),sum(s.safest_count)::bigint,
 sum(s.safest_count::bigint+s.low_safety_count+s.risky_count+s.scammed_count)::bigint,
 count(*) filter(where jsonb_array_length(s.blocktown_answers)=5)
 from public.v003_player_data s join public.atlas_player_region r on r.player_id=s.player_id and r.consent
 join public.atlas_provinces p on p.code=r.province_code
 group by p.code,p.name,p.latitude,p.longitude having count(*)>=5;
$$;
revoke all on function public.atlas_region_summary() from public;
grant execute on function public.atlas_region_summary() to anon,authenticated;
commit;

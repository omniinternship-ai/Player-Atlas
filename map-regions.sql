begin;
create or replace function public.atlas_map_summary()
returns table(province_code text,province_name text,region text,players bigint,total_score numeric,average_score numeric)
language sql stable security definer set search_path='' as $$
 select c.code,c.name,c.region,count(*),sum(s.total_score),avg(s.total_score)
 from public.v003_player_profiles p
 join public.v003_provinces c on c.code=p.province_code
 join public.v003_player_data s on s.player_id=p.player_id
 where p.share_area=true
 group by c.code,c.name,c.region;
$$;
revoke all on function public.atlas_map_summary() from public;
grant execute on function public.atlas_map_summary() to anon,authenticated;
comment on function public.atlas_map_summary() is 'Province-level aggregate for players who explicitly shared their area. No player IDs, names, email or precise coordinates.';
commit;

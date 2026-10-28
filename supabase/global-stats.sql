-- Dashboard for ALL saved V003 players. No region/consent table required.
-- Run in Supabase SQL Editor. Does not grant access to player rows.
begin;
create or replace function public.atlas_global_summary() returns jsonb
language sql stable security definer set search_path='' as $$
with summary as (
 select count(*) as players,coalesce(sum(total_score),0) as total_score,
 coalesce(sum(mission_score),0) as mission_score,coalesce(sum(minigame_score),0) as minigame_score,
 avg(total_score) as average_score,
 coalesce(sum(safest_count),0) as safest,
 coalesce(sum(safest_count::bigint+low_safety_count+risky_count+scammed_count),0) as decisions,
 count(*) filter(where jsonb_array_length(blocktown_answers)=5) as completed,
 max(updated_at) as last_saved_at
 from public.v003_player_data
), groups as (
 select total_score,count(*) as players from public.v003_player_data group by total_score
), ranked as (
 select total_score,players,1+coalesce(sum(players) over(order by total_score desc rows between unbounded preceding and 1 preceding),0) as rank
 from groups
), top_scores as (select * from ranked order by total_score desc limit 20)
select jsonb_build_object('summary',(select to_jsonb(s) from summary s),'ranking',coalesce((select jsonb_agg(to_jsonb(r) order by total_score desc) from top_scores r),'[]'::jsonb),'generated_at',now());
$$;
revoke all on function public.atlas_global_summary() from public;
grant execute on function public.atlas_global_summary() to anon,authenticated;
comment on function public.atlas_global_summary() is 'Public anonymous aggregate: counts, totals, top 20 distinct score groups and competition ranks. Client-reported scores, not anti-cheat verified. No names, IDs, emails or answer history.';
commit;

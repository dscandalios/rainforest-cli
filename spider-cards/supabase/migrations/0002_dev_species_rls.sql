-- Dev mode: allow authenticated clients to insert / update species so the
-- in-app scan flow can enrich new species without an Edge Function.
-- Tighten this back to service-role-only before any real launch.

create policy "authenticated users can insert species (dev)"
  on public.species for insert
  to authenticated
  with check (true);

create policy "authenticated users can update species (dev)"
  on public.species for update
  to authenticated
  using (true);

-- Also: handle_new_capture trigger needs to write to species_observation_count
-- even when the inserter is an anonymous user. Loosen the table RLS to allow
-- authenticated writes; the trigger runs as security definer anyway, but
-- belt-and-braces.
create policy "authenticated users can upsert observation counts (dev)"
  on public.species_observation_count for insert
  to authenticated
  with check (true);

create policy "authenticated users can update observation counts (dev)"
  on public.species_observation_count for update
  to authenticated
  using (true);

-- Allow authenticated users (admin) to manage posts
create policy "Authenticated users can insert posts"
  on public.posts for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update posts"
  on public.posts for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete posts"
  on public.posts for delete
  to authenticated
  using (true);

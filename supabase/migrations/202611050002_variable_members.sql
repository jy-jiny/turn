alter table public.members
  drop constraint if exists members_position_check;

alter table public.members
  add constraint members_position_check check (position between 0 and 11);

alter table public.purchases
  drop constraint if exists purchases_queue_before_check;

alter table public.purchases
  add constraint purchases_queue_before_check check (cardinality(queue_before) between 1 and 12);

create or replace function public.create_room(
  p_slug text,
  p_name text,
  p_member_names text[]
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room_id uuid;
  v_member_count integer := cardinality(p_member_names);
begin
  if char_length(trim(p_name)) not between 1 and 30 then
    raise exception 'INVALID_ROOM_NAME';
  end if;

  if v_member_count not between 1 and 12
    or exists (
      select 1
      from unnest(p_member_names) as member_name
      where char_length(trim(member_name)) not between 1 and 12
    )
    or (select count(distinct trim(member_name)) from unnest(p_member_names) as member_name) <> v_member_count
  then
    raise exception 'INVALID_MEMBERS';
  end if;

  insert into public.rooms (slug, name)
  values (p_slug, trim(p_name))
  returning id into v_room_id;

  insert into public.members (room_id, name, position)
  select v_room_id, trim(member_name), (ordinality - 1)::smallint
  from unnest(p_member_names) with ordinality as input(member_name, ordinality);

  return public.build_room_state(v_room_id);
end;
$$;

create or replace function public.undo_last_purchase(
  p_slug text,
  p_expected_version integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room_id uuid;
  v_version integer;
  v_purchase_id uuid;
  v_queue_before uuid[];
begin
  select room.id, room.version into v_room_id, v_version
  from public.rooms as room
  where room.slug = p_slug
  for update;

  if v_room_id is null then
    raise exception 'ROOM_NOT_FOUND';
  end if;

  if v_version <> p_expected_version then
    raise exception 'VERSION_CONFLICT';
  end if;

  select purchase.id, purchase.queue_before into v_purchase_id, v_queue_before
  from public.purchases as purchase
  where purchase.room_id = v_room_id
  order by purchase.created_at desc, purchase.id desc
  limit 1
  for update;

  if v_purchase_id is null then
    raise exception 'NOTHING_TO_UNDO';
  end if;

  delete from public.purchases where id = v_purchase_id;

  with ranked as (
    select
      member.id,
      (row_number() over (
        order by
          coalesce(
            array_position(v_queue_before, member.id),
            cardinality(v_queue_before) + member.position + 1
          ),
          member.position
      ) - 1)::smallint as next_position
    from public.members as member
    where member.room_id = v_room_id
  )
  update public.members as member
  set position = ranked.next_position
  from ranked
  where member.id = ranked.id;

  update public.rooms
  set version = version + 1, updated_at = now()
  where id = v_room_id;

  return public.build_room_state(v_room_id);
end;
$$;

create or replace function public.update_room(
  p_slug text,
  p_name text,
  p_members jsonb,
  p_expected_version integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room_id uuid;
  v_version integer;
  v_member_count integer;
begin
  select room.id, room.version into v_room_id, v_version
  from public.rooms as room
  where room.slug = p_slug
  for update;

  if v_room_id is null then
    raise exception 'ROOM_NOT_FOUND';
  end if;

  if v_version <> p_expected_version then
    raise exception 'VERSION_CONFLICT';
  end if;

  if jsonb_typeof(p_members) <> 'array' then
    raise exception 'INVALID_MEMBERS';
  end if;

  v_member_count := jsonb_array_length(p_members);

  if char_length(trim(p_name)) not between 1 and 30
    or v_member_count not between 1 and 12
    or exists (
      select 1
      from jsonb_array_elements(p_members) as entry(item)
      where char_length(trim(entry.item ->> 'name')) not between 1 and 12
        or (entry.item ->> 'id') is null
    )
    or (
      select count(distinct trim(entry.item ->> 'name'))
      from jsonb_array_elements(p_members) as entry(item)
    ) <> v_member_count
    or (
      select count(distinct entry.item ->> 'id')
      from jsonb_array_elements(p_members) as entry(item)
    ) <> v_member_count
    or exists (
      select 1
      from public.members as member
      join jsonb_array_elements(p_members) as entry(item)
        on member.id::text = entry.item ->> 'id'
      where member.room_id <> v_room_id
    )
  then
    raise exception 'INVALID_MEMBERS';
  end if;

  delete from public.members where room_id = v_room_id;

  insert into public.members (id, room_id, name, position)
  select
    (entry.item ->> 'id')::uuid,
    v_room_id,
    trim(entry.item ->> 'name'),
    (entry.ordinality - 1)::smallint
  from jsonb_array_elements(p_members) with ordinality as entry(item, ordinality);

  update public.rooms
  set name = trim(p_name), version = version + 1, updated_at = now()
  where id = v_room_id;

  return public.build_room_state(v_room_id);
end;
$$;
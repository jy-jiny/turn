create extension if not exists pgcrypto;

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (char_length(slug) between 20 and 64),
  name text not null check (char_length(name) between 1 and 30),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.members (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 12),
  position smallint not null check (position between 0 and 11),
  unique (room_id, position) deferrable initially deferred
);

create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  buyer_id uuid not null,
  buyer_name text not null,
  queue_before uuid[] not null check (cardinality(queue_before) between 1 and 12),
  created_at timestamptz not null default now()
);

create index purchases_room_created_idx
  on public.purchases (room_id, created_at desc, id desc);

alter table public.rooms enable row level security;
alter table public.members enable row level security;
alter table public.purchases enable row level security;

revoke all on public.rooms from anon, authenticated;
revoke all on public.members from anon, authenticated;
revoke all on public.purchases from anon, authenticated;

create or replace function public.build_room_state(p_room_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'slug', room.slug,
    'name', room.name,
    'version', room.version,
    'updatedAt', room.updated_at,
    'members', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', member.id,
          'name', member.name,
          'position', member.position
        ) order by member.position
      )
      from public.members as member
      where member.room_id = room.id
    ), '[]'::jsonb),
    'purchases', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', recent.id,
          'buyerId', recent.buyer_id,
          'buyerName', recent.buyer_name,
          'createdAt', recent.created_at
        ) order by recent.created_at desc, recent.id desc
      )
      from (
        select purchase.id, purchase.buyer_id, purchase.buyer_name, purchase.created_at
        from public.purchases as purchase
        where purchase.room_id = room.id
        order by purchase.created_at desc, purchase.id desc
        limit 30
      ) as recent
    ), '[]'::jsonb)
  )
  from public.rooms as room
  where room.id = p_room_id;
$$;

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

create or replace function public.get_room_state(p_slug text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_room_id uuid;
begin
  select room.id into v_room_id
  from public.rooms as room
  where room.slug = p_slug;

  if v_room_id is null then
    raise exception 'ROOM_NOT_FOUND';
  end if;

  return public.build_room_state(v_room_id);
end;
$$;

create or replace function public.record_purchase(
  p_slug text,
  p_buyer_id uuid,
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
  v_buyer_name text;
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

  select member.name into v_buyer_name
  from public.members as member
  where member.room_id = v_room_id and member.id = p_buyer_id;

  if v_buyer_name is null then
    raise exception 'INVALID_BUYER';
  end if;

  select array_agg(member.id order by member.position) into v_queue_before
  from public.members as member
  where member.room_id = v_room_id;

  insert into public.purchases (room_id, buyer_id, buyer_name, queue_before)
  values (v_room_id, p_buyer_id, v_buyer_name, v_queue_before);

  with ranked as (
    select
      member.id,
      (row_number() over (
        order by case when member.id = p_buyer_id then 1 else 0 end, member.position
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

revoke all on function public.build_room_state(uuid) from public;
revoke all on function public.create_room(text, text, text[]) from public;
revoke all on function public.get_room_state(text) from public;
revoke all on function public.record_purchase(text, uuid, integer) from public;
revoke all on function public.undo_last_purchase(text, integer) from public;
revoke all on function public.update_room(text, text, jsonb, integer) from public;

grant execute on function public.create_room(text, text, text[]) to service_role;
grant execute on function public.get_room_state(text) to service_role;
grant execute on function public.record_purchase(text, uuid, integer) to service_role;
grant execute on function public.undo_last_purchase(text, integer) to service_role;
grant execute on function public.update_room(text, text, jsonb, integer) to service_role;
create table public.user_roles (
  user_id uuid not null,
  role text not null,
  constraint user_roles_pkey primary key (user_id),
  constraint user_roles_user_id_fkey foreign KEY (user_id) references auth.users (id)
) TABLESPACE pg_default;

create table public.user_payment_methods (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid null,
  card_brand text null,
  last_4 text null,
  exp_month integer null,
  exp_year integer null,
  is_default boolean null default false,
  created_at timestamp with time zone null default now(),
  constraint user_payment_methods_pkey primary key (id),
  constraint user_payment_methods_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.user_invoices (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid null,
  amount integer null,
  status text null,
  invoice_date timestamp with time zone null default now(),
  invoice_number text null,
  constraint user_invoices_pkey primary key (id),
  constraint user_invoices_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.user_addresses (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid null,
  label text null,
  street text null,
  city text null,
  state text null,
  zip_code text null,
  country text null,
  is_default boolean null default false,
  created_at timestamp with time zone null default now(),
  constraint user_addresses_pkey primary key (id),
  constraint user_addresses_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;


create table public.tickets (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  profile_id uuid not null default auth.uid (),
  subject text null,
  status text null default 'open'::text,
  updated_at timestamp with time zone not null default now(),
  last_reply_at timestamp with time zone null,
  priority text null default 'medium'::text,
  constraint tickets_pkey primary key (id),
  constraint tickets_profile_id_fkey foreign KEY (profile_id) references profiles (id) on delete CASCADE,
  constraint tickets_user_id_fkey foreign KEY (profile_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_tickets_profile_id on public.tickets using btree (profile_id) TABLESPACE pg_default;


create table public.ticket_messages (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  ticket_id uuid not null,
  user_id uuid not null default auth.uid (),
  message text null,
  sender_role text null default 'user'::text,
  is_read boolean null default false,
  constraint ticket_messages_pkey primary key (id),
  constraint ticket_messages_ticket_id_fkey foreign KEY (ticket_id) references tickets (id) on delete CASCADE,
  constraint ticket_messages_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create trigger on_new_ticket_message
after INSERT on ticket_messages for EACH row
execute FUNCTION update_ticket_last_reply ();

create trigger on_new_ticket_message_notification
after INSERT on ticket_messages for EACH row
execute FUNCTION notify_on_ticket_reply ();


create table public.profiles (
  id uuid not null,
  role text null default 'user'::text,
  email text null,
  created_at timestamp with time zone null default now(),
  full_name text null,
  avatar_url text null,
  phone text null,
  address text null,
  notification_preferences jsonb null default '{"promotions": false, "order_updates": true, "security_alerts": true}'::jsonb,
  theme_preference text null default 'dark'::text,
  stripe_customer_id text null,
  constraint profiles_pkey primary key (id),
  constraint profiles_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_profiles_id on public.profiles using btree (id) TABLESPACE pg_default;

create index IF not exists idx_profiles_stripe_customer on public.profiles using btree (stripe_customer_id) TABLESPACE pg_default;

create trigger on_profile_update
after
update on profiles for EACH row
execute FUNCTION log_admin_profile_update ();


create table public.orders (
  id uuid not null default gen_random_uuid (),
  profile_id uuid null,
  name text not null,
  email text not null,
  platform text not null,
  product_url text not null,
  review_count integer not null,
  addons jsonb null,
  total_cost integer null,
  created_at timestamp with time zone null default now(),
  checkout_id text null,
  items jsonb null,
  progress_steps jsonb null default '[]'::jsonb,
  internal_notes text null,
  payment_status text not null default 'unpaid'::text,
  status text not null default 'pending'::text,
  stripe_checkout_session_id text null,
  stripe_payment_intent_id text null,
  constraint orders_pkey primary key (id),
  constraint orders_profile_id_fkey foreign KEY (profile_id) references profiles (id) on delete set null,
  constraint orders_user_id_fkey foreign KEY (profile_id) references auth.users (id)
) TABLESPACE pg_default;

create index IF not exists idx_orders_stripe_session on public.orders using btree (stripe_checkout_session_id) TABLESPACE pg_default;

create index IF not exists idx_orders_stripe_payment_intent on public.orders using btree (stripe_payment_intent_id) TABLESPACE pg_default;

create trigger on_order_update_log
after
update on orders for EACH row
execute FUNCTION log_order_update ();

create table public.order_tracking (
  id uuid not null default gen_random_uuid (),
  order_id uuid not null,
  carrier text null,
  tracking_number text not null,
  status text null default 'pending'::text,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint order_tracking_pkey primary key (id),
  constraint order_tracking_order_id_fkey foreign KEY (order_id) references orders (id) on delete CASCADE
) TABLESPACE pg_default;


create table public.order_comments (
  id uuid not null default gen_random_uuid (),
  order_id uuid not null,
  admin_id uuid not null,
  comment text not null,
  created_at timestamp with time zone not null default now(),
  is_read boolean null default false,
  constraint order_comments_pkey primary key (id),
  constraint order_comments_admin_id_fkey foreign KEY (admin_id) references profiles (id) on delete CASCADE,
  constraint order_comments_order_id_fkey foreign KEY (order_id) references orders (id) on delete CASCADE
) TABLESPACE pg_default;

create trigger on_new_order_comment
after INSERT on order_comments for EACH row
execute FUNCTION notify_on_order_comment ();

create trigger on_order_comment_insert
after INSERT on order_comments for EACH row
execute FUNCTION log_order_comment_add ();

create table public.order_actions (
  id uuid not null default gen_random_uuid (),
  order_id uuid not null,
  action text not null,
  details jsonb null default '{}'::jsonb,
  performed_by uuid null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint order_actions_pkey primary key (id),
  constraint order_actions_order_id_fkey foreign KEY (order_id) references orders (id) on delete CASCADE,
  constraint order_actions_performed_by_fkey foreign KEY (performed_by) references profiles (id)
) TABLESPACE pg_default;

create table public.notifications (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamp with time zone not null default now(),
  link text null,
  type text null,
  constraint notifications_pkey primary key (id),
  constraint notifications_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.admin_activity_log (
  id uuid not null default gen_random_uuid (),
  admin_id uuid not null,
  admin_email text null,
  action text not null,
  target_user_id uuid null,
  target_order_id uuid null,
  details jsonb null,
  created_at timestamp with time zone not null default now(),
  constraint admin_activity_log_pkey primary key (id),
  constraint admin_activity_log_admin_id_fkey foreign KEY (admin_id) references profiles (id) on delete set null,
  constraint admin_activity_log_target_order_id_fkey foreign KEY (target_order_id) references orders (id) on delete set null,
  constraint admin_activity_log_target_user_id_fkey foreign KEY (target_user_id) references profiles (id) on delete set null
) TABLESPACE pg_default;
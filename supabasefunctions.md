# Function 1

Name of function: get_all_user_stats
Name will also be used for the function name in postgres
Schema

schema: public

Tables made in the table editor will be in 'public'
Arguments
Arguments can be referenced in the function body using either names or numbers.

No argument for this function

SELECT
p.id as user_id,
COUNT(o.id) as total_orders,
COALESCE(SUM(CASE WHEN o.payment_status = 'paid' THEN o.total_cost ELSE 0 END), 0) as total_spent
FROM
public.profiles p
LEFT JOIN
public.orders o ON p.id = o.profile_id
GROUP BY
p.id;

# Function 2

Edit 'handle_new_user' function
Name of function
handle_new_user
Name will also be used for the function name in postgres
Schema

schema

public

Tables made in the table editor will be in 'public'
Arguments
Arguments can be referenced in the function body using either names or numbers.

No argument for this function
Definition
The language below should be written in plpgsql.

BEGIN
INSERT INTO public.profiles (id, email, role, created_at)
VALUES (new.id, new.email, 'user', NOW());
RETURN new;
END;

# Function 3

Name of function
is_admin
Name will also be used for the function name in postgres
Schema

schema

public

Tables made in the table editor will be in 'public'
Arguments
Arguments can be referenced in the function body using either names or numbers.

No argument for this function
Definition
The language below should be written in sq

SELECT EXISTS (
SELECT 1
FROM profiles
WHERE id = auth.uid()
AND role = 'admin'
);

# Function 4

Name of function
log_admin_profile_update
Name will also be used for the function name in postgres
Schema

schema

public

Tables made in the table editor will be in 'public'
Arguments
Arguments can be referenced in the function body using either names or numbers.

No argument for this function
Definition
The language below should be written in plpgsql.

DECLARE
admin_id_val uuid;
admin_email_val text;
BEGIN
SELECT auth.uid(), (auth.jwt() ->> 'email') INTO admin_id_val, admin_email_val;

IF admin_id_val IS NULL THEN
admin_id_val := '00000000-0000-0000-0000-000000000000';
admin_email_val := 'system';
END IF;

IF OLD.role IS DISTINCT FROM NEW.role THEN
INSERT INTO public.admin_activity_log (admin_id, admin_email, action, target_user_id, details)
VALUES (admin_id_val, admin_email_val, 'User Role Changed', NEW.id, jsonb_build_object('from', OLD.role, 'to', NEW.role));
END IF;

RETURN NEW;
END;

# Function 5

Name of function
log_admin_user_update
Name will also be used for the function name in postgres
Schema

schema

public

Tables made in the table editor will be in 'public'
Arguments
Arguments can be referenced in the function body using either names or numbers.

No argument for this function
Definition
The language below should be written in plpgsql.

DECLARE
admin_id_val uuid;
admin_email_val text;
action_text text;
details_json jsonb;
BEGIN
-- Attempt to get the admin user's ID and email from the session
-- This relies on the admin performing the action having their role set in auth.jwt.claims.
-- You must configure this in Supabase JWT settings if not already done.
SELECT auth.uid(), (auth.jwt() ->> 'email') INTO admin_id_val, admin_email_val;

-- If the session info is not available (e.g., background process), log it as system
IF admin_id_val IS NULL THEN
admin_id_val := '00000000-0000-0000-0000-000000000000'; -- A placeholder UUID for system
admin_email_val := 'system';
END IF;

-- Determine the action based on what changed
IF OLD.banned_until IS DISTINCT FROM NEW.banned_until THEN
IF NEW.banned_until IS NULL OR NEW.banned_until < now() THEN
action_text := 'User Unbanned';
ELSE
action_text := 'User Banned';
END IF;
details_json := jsonb_build_object('banned_until', NEW.banned_until);
ELSE
-- Fallback for other potential changes, can be expanded
action_text := 'User Profile Updated';
details_json := jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW));
END IF;

-- Insert into the log
INSERT INTO public.admin_activity_log (admin_id, admin_email, action, target_user_id, details)
VALUES (admin_id_val, admin_email_val, action_text, NEW.id, details_json);

RETURN NEW;
END;

# Function 6

Name of function
log_order_comment_add
Name will also be used for the function name in postgres
Schema

schema

public

Tables made in the table editor will be in 'public'
Arguments
Arguments can be referenced in the function body using either names or numbers.

No argument for this function
Definition
The language below should be written in plpgsql.

DECLARE
admin_id_val uuid;
admin_email_val text;
BEGIN
admin_id_val := NEW.admin_id;
SELECT email INTO admin_email_val FROM public.profiles WHERE id = admin_id_val;

    IF admin_email_val IS NULL THEN
       admin_email_val := 'Unknown';
    END IF;

    INSERT INTO public.admin_activity_log (admin_id, admin_email, action, target_order_id, details)
    VALUES (admin_id_val, admin_email_val, 'Order Comment Added', NEW.order_id, jsonb_build_object('comment', NEW.comment));

    NEW.is_read := FALSE;
    RETURN NEW;

END;

# Function 7

Name of function
log_order_update
Name will also be used for the function name in postgres
Schema

schema

public

Tables made in the table editor will be in 'public'
Arguments
Arguments can be referenced in the function body using either names or numbers.

No argument for this function
Definition
The language below should be written in plpgsql.

DECLARE
current_user_id uuid := auth.uid();
current_user_email text := (auth.jwt() ->> 'email');
is_admin_user boolean := false;
action_text text;
details_json jsonb := '{}'::jsonb;
BEGIN
-- Check if admin
SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = current_user_id AND role = 'admin') INTO is_admin_user;

IF NOT is_admin_user THEN
RETURN NEW;
END IF;

IF OLD.status IS DISTINCT FROM NEW.status THEN
action_text := 'Order Status Changed';
details_json := details_json || jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status);
INSERT INTO public.order_actions (order_id, action, details, performed_by)
VALUES (NEW.id, action_text, details_json, current_user_id);
END IF;

IF OLD.payment_status IS DISTINCT FROM NEW.payment_status THEN
action_text := 'Payment Status Changed';
details_json := details_json || jsonb_build_object('old_payment_status', OLD.payment_status, 'new_payment_status', NEW.payment_status);
INSERT INTO public.order_actions (order_id, action, details, performed_by)
VALUES (NEW.id, action_text, details_json, current_user_id);
END IF;

IF OLD.internal_notes IS DISTINCT FROM NEW.internal_notes THEN
action_text := 'Internal Notes Updated';
details_json := details_json || jsonb_build_object('old_notes', OLD.internal_notes, 'new_notes', NEW.internal_notes);
INSERT INTO public.order_actions (order_id, action, details, performed_by)
VALUES (NEW.id, action_text, details_json, current_user_id);
END IF;

RETURN NEW;
END;

# Function 8

Name of function
notify_on_order_comment
Name will also be used for the function name in postgres
Schema

schema

public

Tables made in the table editor will be in 'public'
Arguments
Arguments can be referenced in the function body using either names or numbers.

No argument for this function
Definition
The language below should be written in plpgsql.

DECLARE
order_owner_id uuid;
BEGIN
SELECT profile_id INTO order_owner_id FROM orders WHERE id = NEW.order_id;

IF NEW.admin_id IS NOT NULL AND order_owner_id IS NOT NULL THEN
INSERT INTO public.notifications (user_id, message, link, type)
VALUES (order_owner_id, 'Admin left a note on your order #' || substr(NEW.order_id::text, 1, 8), '/dashboard?tab=orders', 'order_comment');
END IF;

RETURN NEW;
END;

# Function 9

Name of function
notify_on_ticket_reply
Name will also be used for the function name in postgres
Schema

schema

public

Tables made in the table editor will be in 'public'
Arguments
Arguments can be referenced in the function body using either names or numbers.

No argument for this function
Definition
The language below should be written in plpgsql.

DECLARE
ticket_owner_id uuid;
admin_profile RECORD;
BEGIN
-- Get the owner of the ticket
SELECT profile_id INTO ticket_owner_id FROM tickets WHERE id = NEW.ticket_id;

-- If the sender is an admin, notify the ticket owner
IF NEW.sender_role = 'admin' THEN
IF ticket_owner_id IS NOT NULL THEN
INSERT INTO public.notifications (user_id, message, link, type)
VALUES (ticket_owner_id, 'Support: New reply on ticket #' || substr(NEW.ticket_id::text, 1, 8), '/dashboard?tab=support&ticket_id=' || NEW.ticket_id, 'ticket_reply');
END IF;

-- If the sender is a user, notify all admins
ELSE
FOR admin_profile IN SELECT id FROM profiles WHERE role = 'admin' LOOP
INSERT INTO public.notifications (user_id, message, link, type)
VALUES (admin_profile.id, 'Support: User reply on ticket #' || substr(NEW.ticket_id::text, 1, 8), '/dashboard?tab=support&ticket_id=' || NEW.ticket_id, 'ticket_reply');
END LOOP;
END IF;

RETURN NEW;
END;

# Function 10

Name of function
update_ticket_last_reply
Name will also be used for the function name in postgres
Schema

schema

public

Tables made in the table editor will be in 'public'
Arguments
Arguments can be referenced in the function body using either names or numbers.

No argument for this function
Definition
The language below should be written in plpgsql.

BEGIN
UPDATE tickets
SET last_reply_at = NOW(),
status = 'open'
WHERE id = NEW.ticket_id;
RETURN NEW;
END;

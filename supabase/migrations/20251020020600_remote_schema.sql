alter table "public"."regulation_scripts" disable row level security;

alter table "public"."stories" disable row level security;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.increment_session_completed_rounds()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.completed_at IS NOT NULL AND (OLD.completed_at IS NULL OR OLD.completed_at IS DISTINCT FROM NEW.completed_at) THEN
    UPDATE sessions
    SET completed_rounds = completed_rounds + 1
    WHERE id = NEW.session_id;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;



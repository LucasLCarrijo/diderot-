-- Server-side validation for profiles to prevent storing malicious content

CREATE OR REPLACE FUNCTION public.validate_profile_fields()
RETURNS TRIGGER AS $$
DECLARE
  v text;
BEGIN
  -- Normalize empty strings to NULL for optional fields
  IF NEW.bio IS NOT NULL AND btrim(NEW.bio) = '' THEN NEW.bio := NULL; END IF;
  IF NEW.avatar_url IS NOT NULL AND btrim(NEW.avatar_url) = '' THEN NEW.avatar_url := NULL; END IF;
  IF NEW.instagram_url IS NOT NULL AND btrim(NEW.instagram_url) = '' THEN NEW.instagram_url := NULL; END IF;
  IF NEW.tiktok_url IS NOT NULL AND btrim(NEW.tiktok_url) = '' THEN NEW.tiktok_url := NULL; END IF;
  IF NEW.youtube_url IS NOT NULL AND btrim(NEW.youtube_url) = '' THEN NEW.youtube_url := NULL; END IF;
  IF NEW.website_url IS NOT NULL AND btrim(NEW.website_url) = '' THEN NEW.website_url := NULL; END IF;

  -- Required: name
  IF NEW.name IS NULL OR length(btrim(NEW.name)) < 2 THEN
    RAISE EXCEPTION 'Nome deve ter pelo menos 2 caracteres';
  END IF;
  IF length(NEW.name) > 100 THEN
    RAISE EXCEPTION 'Nome deve ter no máximo 100 caracteres';
  END IF;
  IF NEW.name ~ '<[^>]*>' THEN
    RAISE EXCEPTION 'Nome não pode conter HTML';
  END IF;

  -- Required: username
  IF NEW.username IS NULL OR length(btrim(NEW.username)) < 3 THEN
    RAISE EXCEPTION 'Username deve ter pelo menos 3 caracteres';
  END IF;
  IF length(NEW.username) > 50 THEN
    RAISE EXCEPTION 'Username deve ter no máximo 50 caracteres';
  END IF;
  IF NEW.username !~ '^[a-zA-Z0-9_-]+$' THEN
    RAISE EXCEPTION 'Username inválido';
  END IF;

  -- Optional: bio
  IF NEW.bio IS NOT NULL THEN
    IF length(NEW.bio) > 500 THEN
      RAISE EXCEPTION 'Bio deve ter no máximo 500 caracteres';
    END IF;
    IF NEW.bio ILIKE '%<script%' THEN
      RAISE EXCEPTION 'Bio não pode conter scripts';
    END IF;
  END IF;

  -- Optional URL fields (http/https only + block dangerous protocols)
  FOREACH v IN ARRAY ARRAY[NEW.avatar_url, NEW.instagram_url, NEW.tiktok_url, NEW.youtube_url, NEW.website_url]
  LOOP
    IF v IS NULL THEN
      CONTINUE;
    END IF;

    IF length(v) > 500 THEN
      RAISE EXCEPTION 'URL deve ter no máximo 500 caracteres';
    END IF;

    IF lower(v) ~ '^(javascript:|data:|vbscript:|file:)' THEN
      RAISE EXCEPTION 'Protocolo não permitido';
    END IF;

    IF NOT (lower(v) LIKE 'http://%' OR lower(v) LIKE 'https://%') THEN
      RAISE EXCEPTION 'URL deve começar com https:// ou http://';
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for server-side profile validation
DROP TRIGGER IF EXISTS validate_profile_fields_trigger ON public.profiles;
CREATE TRIGGER validate_profile_fields_trigger
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.validate_profile_fields();

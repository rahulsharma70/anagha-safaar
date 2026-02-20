-- Fix hardcoded default encryption key in encrypt_guest_data and decrypt_guest_data functions
-- Replace the unsafe fallback with a fail-safe exception

CREATE OR REPLACE FUNCTION public.encrypt_guest_data(data jsonb)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key text;
  encrypted_data text;
BEGIN
  -- Get encryption key from environment setting
  encryption_key := current_setting('app.encryption_key', true);

  -- Fail-safe: never allow encryption with missing or empty key
  IF encryption_key IS NULL OR encryption_key = '' THEN
    RAISE EXCEPTION 'Encryption key not configured. Set app.encryption_key before encrypting guest data.';
  END IF;

  -- Encrypt using pgcrypto AES
  encrypted_data := encode(
    encrypt(data::text::bytea, encryption_key::bytea, 'aes'),
    'base64'
  );

  RETURN encrypted_data;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrypt_guest_data(encrypted_data text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key text;
  decrypted_data text;
BEGIN
  -- Get encryption key from environment setting
  encryption_key := current_setting('app.encryption_key', true);

  -- Fail-safe: never allow decryption with missing or empty key
  IF encryption_key IS NULL OR encryption_key = '' THEN
    RAISE EXCEPTION 'Encryption key not configured. Set app.encryption_key before decrypting guest data.';
  END IF;

  -- Decrypt using pgcrypto AES
  decrypted_data := convert_from(
    decrypt(
      decode(encrypted_data, 'base64'),
      encryption_key::bytea,
      'aes'
    ),
    'UTF8'
  );

  RETURN decrypted_data::jsonb;
END;
$$;
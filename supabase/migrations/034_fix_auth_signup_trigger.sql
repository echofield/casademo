-- Fix auth signup trigger so admin-created users can create profiles reliably
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role_value public.user_role;
BEGIN
  BEGIN
    IF NEW.raw_user_meta_data IS NOT NULL
      AND NEW.raw_user_meta_data->>'role' IS NOT NULL
      AND NEW.raw_user_meta_data->>'role' <> '' THEN
      user_role_value := (NEW.raw_user_meta_data->>'role')::public.user_role;
    ELSE
      user_role_value := 'seller';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    user_role_value := 'seller';
  END;

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), NEW.email, 'User'),
    user_role_value
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

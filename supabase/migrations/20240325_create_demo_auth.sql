-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.update_demo_user;

-- Create a function to handle demo user creation/update
CREATE OR REPLACE FUNCTION public.update_demo_user(
  p_email TEXT,
  p_password TEXT,
  p_role TEXT,
  p_full_name TEXT,
  p_grade_level TEXT
) RETURNS void AS $$
DECLARE
  v_uid uuid;
  v_existing_user auth.users%ROWTYPE;
BEGIN
  -- Check if user exists in auth.users
  SELECT * INTO v_existing_user
  FROM auth.users
  WHERE email = p_email;

  IF v_existing_user.id IS NULL THEN
    -- Create new user if doesn't exist
    v_uid := gen_random_uuid();
    
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      aud,
      role,
      created_at,
      updated_at,
      confirmation_sent_at
    )
    VALUES (
      v_uid,
      '00000000-0000-0000-0000-000000000000',
      p_email,
      crypt(p_password, gen_salt('bf')),
      NOW(),
      jsonb_build_object(
        'provider', 'email',
        'providers', ARRAY['email']
      ),
      jsonb_build_object(
        'full_name', p_full_name,
        'role', p_role,
        'grade_level', p_grade_level
      ),
      'authenticated',
      'authenticated',
      NOW(),
      NOW(),
      NOW()
    );

    -- Also create entry in public.users
    INSERT INTO public.users (
      id,
      email,
      full_name,
      role,
      grade_level
    ) VALUES (
      v_uid,
      p_email,
      p_full_name,
      p_role,
      p_grade_level
    );
  ELSE
    -- Update existing user
    UPDATE auth.users
    SET 
      encrypted_password = crypt(p_password, gen_salt('bf')),
      email_confirmed_at = NOW(),
      raw_user_meta_data = jsonb_build_object(
        'full_name', p_full_name,
        'role', p_role,
        'grade_level', p_grade_level
      ),
      updated_at = NOW()
    WHERE id = v_existing_user.id;

    -- Update public.users as well
    UPDATE public.users
    SET
      full_name = p_full_name,
      role = p_role,
      grade_level = p_grade_level
    WHERE email = p_email;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 
-- Helper function to check if a user is a demo user
CREATE OR REPLACE FUNCTION public.is_demo_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    EXISTS (
      SELECT 1
      FROM auth.users
      WHERE 
        id = auth.uid() 
        AND email LIKE 'demo.%@aicademy.edu'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove any existing policies for these tables
DROP POLICY IF EXISTS "Demo users are read-only" ON public.users;
DROP POLICY IF EXISTS "Demo users are read-only" ON public.classes;
DROP POLICY IF EXISTS "Demo users are read-only" ON public.class_memberships;
DROP POLICY IF EXISTS "Demo users are read-only" ON public.modules;
DROP POLICY IF EXISTS "Demo users are read-only" ON public.module_assignments;

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_assignments ENABLE ROW LEVEL SECURITY;

-- Create read-only policies for demo users
CREATE POLICY "Demo users are read-only" ON public.users
  FOR ALL
  TO authenticated
  USING (
    CASE 
      WHEN public.is_demo_user() THEN true  -- Demo users can read
      WHEN NOT public.is_demo_user() THEN true  -- Regular users have full access
    END
  )
  WITH CHECK (NOT public.is_demo_user());  -- Demo users cannot write

CREATE POLICY "Demo users are read-only" ON public.classes
  FOR ALL
  TO authenticated
  USING (
    CASE 
      WHEN public.is_demo_user() THEN true
      WHEN NOT public.is_demo_user() THEN true
    END
  )
  WITH CHECK (NOT public.is_demo_user());

CREATE POLICY "Demo users are read-only" ON public.class_memberships
  FOR ALL
  TO authenticated
  USING (
    CASE 
      WHEN public.is_demo_user() THEN true
      WHEN NOT public.is_demo_user() THEN true
    END
  )
  WITH CHECK (NOT public.is_demo_user());

CREATE POLICY "Demo users are read-only" ON public.modules
  FOR ALL
  TO authenticated
  USING (
    CASE 
      WHEN public.is_demo_user() THEN true
      WHEN NOT public.is_demo_user() THEN true
    END
  )
  WITH CHECK (NOT public.is_demo_user());

CREATE POLICY "Demo users are read-only" ON public.module_assignments
  FOR ALL
  TO authenticated
  USING (
    CASE 
      WHEN public.is_demo_user() THEN true
      WHEN NOT public.is_demo_user() THEN true
    END
  )
  WITH CHECK (NOT public.is_demo_user());

-- Add comment explaining the policies
COMMENT ON FUNCTION public.is_demo_user() IS 'Helper function to check if the current user is a demo user (email contains demo. and @aicademy.edu)'; 
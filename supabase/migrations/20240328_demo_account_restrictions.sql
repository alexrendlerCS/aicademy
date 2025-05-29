-- Helper function to check if a user is a demo account
CREATE OR REPLACE FUNCTION public.is_demo_account()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    auth.uid() IN ('a02fead5-0acd-4eec-a0dc-45306d5043c5', 'd69a7de3-10f9-4718-9785-73114433fae9')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Quiz Attempts
CREATE POLICY "Prevent demo accounts from modifying quiz_attempts"
ON "quiz_attempts"
FOR ALL
TO authenticated
USING (NOT is_demo_account());

-- Class Memberships
CREATE POLICY "Prevent demo accounts from modifying class_memberships"
ON "class_memberships"
FOR ALL
TO authenticated
USING (NOT is_demo_account());

-- Classes
CREATE POLICY "Prevent demo accounts from modifying classes"
ON "classes"
FOR ALL
TO authenticated
USING (NOT is_demo_account());

-- Modules
CREATE POLICY "Prevent demo accounts from modifying modules"
ON "modules"
FOR ALL
TO authenticated
USING (NOT is_demo_account());

-- Module Assignments
CREATE POLICY "Prevent demo accounts from modifying module_assignments"
ON "module_assignments"
FOR ALL
TO authenticated
USING (NOT is_demo_account());

-- Lesson Progress
CREATE POLICY "Prevent demo accounts from modifying lesson_progress"
ON "lesson_progress"
FOR ALL
TO authenticated
USING (NOT is_demo_account());

-- Ensure RLS is enabled on all tables
ALTER TABLE "quiz_attempts" FORCE ROW LEVEL SECURITY;
ALTER TABLE "class_memberships" FORCE ROW LEVEL SECURITY;
ALTER TABLE "classes" FORCE ROW LEVEL SECURITY;
ALTER TABLE "modules" FORCE ROW LEVEL SECURITY;
ALTER TABLE "module_assignments" FORCE ROW LEVEL SECURITY;
ALTER TABLE "lesson_progress" FORCE ROW LEVEL SECURITY; 
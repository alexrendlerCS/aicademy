import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY! // Note: This needs to be the service key, not the anon key
);

export async function createDemoAccounts() {
  try {
    // Create demo teacher account
    const teacherId = uuidv4();
    const { data: teacherAuthData, error: teacherAuthError } =
      await supabase.auth.admin.createUser({
        email: "demo.teacher@aicademy.edu",
        password: "demo123", // You should use a more secure password in production
        email_confirm: true,
        user_metadata: {
          full_name: "Demo Teacher",
          role: "teacher",
        },
      });

    if (teacherAuthError) throw teacherAuthError;

    // Explicitly confirm teacher email
    const { error: teacherConfirmError } = await supabase.auth.admin.updateUserById(
      teacherAuthData.user.id,
      { email_confirm: true }
    );

    if (teacherConfirmError) throw teacherConfirmError;

    // Create demo student account
    const studentId = uuidv4();
    const { data: studentAuthData, error: studentAuthError } =
      await supabase.auth.admin.createUser({
        email: "demo.student@aicademy.edu",
        password: "demo123", // You should use a more secure password in production
        email_confirm: true,
        user_metadata: {
          full_name: "Demo Student",
          role: "student",
          grade_level: "11",
        },
      });

    if (studentAuthError) throw studentAuthError;

    // Explicitly confirm student email
    const { error: studentConfirmError } = await supabase.auth.admin.updateUserById(
      studentAuthData.user.id,
      { email_confirm: true }
    );

    if (studentConfirmError) throw studentConfirmError;

    // Create demo classes
    const classIds = {
      computerScience: uuidv4(),
      mathematics: uuidv4(),
      physics: uuidv4(),
    };

    const { error: classError } = await supabase.from("classes").insert([
      {
        id: classIds.computerScience,
        name: "AP Computer Science",
        description: "Learn programming fundamentals",
        created_by: teacherAuthData.user.id,
        code: "DEMOCS101",
      },
      {
        id: classIds.mathematics,
        name: "Advanced Mathematics",
        description: "Advanced math concepts",
        created_by: teacherAuthData.user.id,
        code: "DEMOMT201",
      },
      {
        id: classIds.physics,
        name: "Physics",
        description: "Introduction to Physics",
        created_by: teacherAuthData.user.id,
        code: "DEMOPH301",
      },
    ]);

    if (classError) throw classError;

    // Create class memberships
    const { error: membershipError } = await supabase
      .from("class_memberships")
      .insert([
        {
          class_id: classIds.computerScience,
          user_id: studentAuthData.user.id,
          role: "student",
          status: "active",
        },
        {
          class_id: classIds.mathematics,
          user_id: studentAuthData.user.id,
          role: "student",
          status: "active",
        },
        {
          class_id: classIds.physics,
          user_id: studentAuthData.user.id,
          role: "student",
          status: "active",
        },
      ]);

    if (membershipError) throw membershipError;

    // Create demo modules
    const moduleIds = {
      programming: uuidv4(),
      algebra: uuidv4(),
      mechanics: uuidv4(),
    };

    const { error: moduleError } = await supabase.from("modules").insert([
      {
        id: moduleIds.programming,
        title: "Introduction to Programming",
        description: "Learn basic programming concepts",
        content: {
          lessons: [
            {
              title: "Variables and Data Types",
              content: "Introduction to programming variables...",
            },
            {
              title: "Control Flow",
              content: "Understanding if statements and loops...",
            },
          ],
        },
        created_by: teacherAuthData.user.id,
      },
      {
        id: moduleIds.algebra,
        title: "Advanced Algebra",
        description: "Master algebraic concepts",
        content: {
          lessons: [
            {
              title: "Quadratic Equations",
              content: "Solving quadratic equations...",
            },
            {
              title: "Functions",
              content: "Understanding functions and their graphs...",
            },
          ],
        },
        created_by: teacherAuthData.user.id,
      },
      {
        id: moduleIds.mechanics,
        title: "Physics Mechanics",
        description: "Understanding motion and forces",
        content: {
          lessons: [
            {
              title: "Newton's Laws",
              content: "Introduction to Newton's laws of motion...",
            },
            {
              title: "Kinematics",
              content: "Understanding motion graphs...",
            },
          ],
        },
        created_by: teacherAuthData.user.id,
      },
    ]);

    if (moduleError) throw moduleError;

    // Create module progress
    const { error: progressError } = await supabase
      .from("module_progress")
      .insert([
        {
          user_id: studentAuthData.user.id,
          module_id: moduleIds.programming,
          completed: true,
          score: 95,
        },
        {
          user_id: studentAuthData.user.id,
          module_id: moduleIds.algebra,
          completed: true,
          score: 88,
        },
        {
          user_id: studentAuthData.user.id,
          module_id: moduleIds.mechanics,
          completed: false,
          score: null,
        },
      ]);

    if (progressError) throw progressError;

    // Create module assignments
    const { error: assignmentError } = await supabase
      .from("module_assignments")
      .insert([
        {
          module_id: moduleIds.programming,
          class_id: classIds.computerScience,
          created_by: teacherAuthData.user.id,
        },
        {
          module_id: moduleIds.algebra,
          class_id: classIds.mathematics,
          created_by: teacherAuthData.user.id,
        },
        {
          module_id: moduleIds.mechanics,
          class_id: classIds.physics,
          created_by: teacherAuthData.user.id,
        },
      ]);

    if (assignmentError) throw assignmentError;

    return {
      success: true,
      teacherId: teacherAuthData.user.id,
      studentId: studentAuthData.user.id,
    };
  } catch (error) {
    console.error("Error creating demo accounts:", error);
    return {
      success: false,
      error,
    };
  }
}

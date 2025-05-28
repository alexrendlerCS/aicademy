-- Create demo accounts with proper UUID handling
DO $$
DECLARE
    demo_teacher_uuid UUID;
    demo_student_uuid UUID;
    demo_class_uuid UUID;
    demo_module_uuid UUID;
    demo_lesson_uuid UUID;
BEGIN
    -- Create Demo Teacher in auth.users using Supabase auth function
    SELECT id INTO demo_teacher_uuid FROM auth.users 
    WHERE email = 'demo.teacher@aicademy.edu';
    
    IF demo_teacher_uuid IS NULL THEN
        SELECT auth.uid() INTO demo_teacher_uuid;
        
        PERFORM auth.create_user(
            uid := demo_teacher_uuid,
            email := 'demo.teacher@aicademy.edu',
            password := 'demo123',
            email_confirmed := true,
            raw_user_meta_data := '{"role": "teacher"}'::jsonb
        );
        
        -- Create Demo Teacher in public.users
        INSERT INTO public.users (
            id,
            full_name,
            email,
            role,
            created_at
        ) VALUES (
            demo_teacher_uuid,
            'Demo Teacher',
            'demo.teacher@aicademy.edu',
            'teacher',
            NOW()
        );
    END IF;

    -- Create Demo Student in auth.users using Supabase auth function
    SELECT id INTO demo_student_uuid FROM auth.users 
    WHERE email = 'demo.student@aicademy.edu';
    
    IF demo_student_uuid IS NULL THEN
        SELECT auth.uid() INTO demo_student_uuid;
        
        PERFORM auth.create_user(
            uid := demo_student_uuid,
            email := 'demo.student@aicademy.edu',
            password := 'demo123',
            email_confirmed := true,
            raw_user_meta_data := '{"role": "student"}'::jsonb
        );
        
        -- Create Demo Student in public.users
        INSERT INTO public.users (
            id,
            full_name,
            email,
            role,
            grade_level,
            created_at
        ) VALUES (
            demo_student_uuid,
            'Demo Student',
            'demo.student@aicademy.edu',
            'student',
            '11',
            NOW()
        );
    END IF;

    -- Create class memberships for demo student in existing classes
    -- Using Introduction to Programming 2025 class
    INSERT INTO public.class_memberships (
        id,
        class_id,
        student_id,
        status,
        joined_at
    ) VALUES (
        gen_random_uuid(),
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        demo_student_uuid,
        'approved',
        NOW()
    ) ON CONFLICT (class_id, student_id) DO NOTHING;

    -- Create lesson progress for the demo student
    -- Using existing lessons from the programming module
    INSERT INTO public.lesson_progress (
        id,
        student_id,
        lesson_id,
        completed,
        completed_at,
        xp_earned
    )
    SELECT 
        gen_random_uuid(),
        demo_student_uuid,
        id,
        TRUE,
        NOW(),
        100
    FROM public.lessons 
    WHERE module_id = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'
    LIMIT 3
    ON CONFLICT (student_id, lesson_id) 
    DO UPDATE SET 
        completed = EXCLUDED.completed,
        completed_at = EXCLUDED.completed_at,
        xp_earned = EXCLUDED.xp_earned;

    -- Create student module assignments
    INSERT INTO public.student_modules (
        id,
        student_id,
        module_id,
        assigned_by,
        assigned_at,
        completed_at
    )
    SELECT
        gen_random_uuid(),
        demo_student_uuid,
        id,
        demo_teacher_uuid,
        NOW(),
        CASE WHEN random() > 0.5 THEN NOW() ELSE NULL END
    FROM public.modules
    WHERE subject = 'science'
    LIMIT 3
    ON CONFLICT (student_id, module_id) 
    DO UPDATE SET 
        assigned_by = EXCLUDED.assigned_by,
        assigned_at = EXCLUDED.assigned_at,
        completed_at = EXCLUDED.completed_at;

    -- Create a demo class
    demo_class_uuid := gen_random_uuid();
    INSERT INTO public.classes (
        id,
        name,
        code
    ) VALUES (
        demo_class_uuid,
        'Introduction to AI',
        'DEMOAI'
    );

    -- Create a demo module
    demo_module_uuid := gen_random_uuid();
    INSERT INTO public.modules (
        id,
        title,
        description,
        subject,
        teacher_id
    ) VALUES (
        demo_module_uuid,
        'Getting Started with AI',
        'Introduction to artificial intelligence concepts',
        'Computer Science',
        demo_teacher_uuid
    );

    -- Create module assignment
    INSERT INTO public.module_assignments (
        id,
        module_id,
        class_id,
        assigned_by,
        assigned_at
    ) VALUES (
        gen_random_uuid(),
        demo_module_uuid,
        demo_class_uuid,
        demo_teacher_uuid,
        NOW()
    );

    -- Create a demo lesson
    demo_lesson_uuid := gen_random_uuid();
    INSERT INTO public.lessons (
        id,
        module_id,
        title,
        content,
        order_index
    ) VALUES (
        demo_lesson_uuid,
        demo_module_uuid,
        'Understanding AI Basics',
        'This lesson covers the fundamental concepts of artificial intelligence.',
        1
    );

    -- Add lesson progress for the demo student
    INSERT INTO public.lesson_progress (
        id,
        student_id,
        lesson_id,
        completed,
        xp_earned
    ) VALUES (
        gen_random_uuid(),
        demo_student_uuid,
        demo_lesson_uuid,
        true,
        100
    );

    -- Add a quiz question
    INSERT INTO public.quiz_questions (
        id,
        lesson_id,
        question,
        type,
        options,
        correct_index
    ) VALUES (
        gen_random_uuid(),
        demo_lesson_uuid,
        'What is artificial intelligence?',
        'multiple_choice',
        ARRAY['A computer program that can think', 'The simulation of human intelligence by machines', 'A robot', 'A database system'],
        1
    );

END $$; 
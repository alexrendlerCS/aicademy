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
            raw_user_meta_data := '{"role": "teacher", "full_name": "Demo Teacher"}'::jsonb
        );
    END IF;

    -- Ensure Demo Teacher exists in public.users
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
    ) ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        role = EXCLUDED.role;

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
            raw_user_meta_data := '{"role": "student", "full_name": "Demo Student", "grade_level": "11"}'::jsonb
        );
    END IF;

    -- Ensure Demo Student exists in public.users
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
    ) ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        role = EXCLUDED.role,
        grade_level = EXCLUDED.grade_level;

    -- Create a demo class
    demo_class_uuid := gen_random_uuid();
    INSERT INTO public.classes (
        id,
        name,
        code,
        teacher_id,
        created_at
    ) VALUES (
        demo_class_uuid,
        'Introduction to AI',
        'DEMOAI101',
        demo_teacher_uuid,
        NOW()
    ) ON CONFLICT (id) DO NOTHING;

    -- Create class membership for demo student
    INSERT INTO public.class_memberships (
        id,
        class_id,
        student_id,
        status,
        joined_at
    ) VALUES (
        gen_random_uuid(),
        demo_class_uuid,
        demo_student_uuid,
        'approved',
        NOW()
    ) ON CONFLICT (id) DO NOTHING;

    -- Create a demo module
    demo_module_uuid := gen_random_uuid();
    INSERT INTO public.modules (
        id,
        title,
        description,
        subject,
        teacher_id,
        created_at
    ) VALUES (
        demo_module_uuid,
        'Getting Started with AI',
        'Introduction to artificial intelligence concepts and applications',
        'Computer Science',
        demo_teacher_uuid,
        NOW()
    ) ON CONFLICT (id) DO NOTHING;

    -- Create module assignment
    INSERT INTO public.module_assignments (
        id,
        module_id,
        class_id,
        assigned_by,
        assigned_at,
        due_date
    ) VALUES (
        gen_random_uuid(),
        demo_module_uuid,
        demo_class_uuid,
        demo_teacher_uuid,
        NOW(),
        NOW() + interval '7 days'
    ) ON CONFLICT (id) DO NOTHING;

    -- Create demo lessons
    FOR i IN 1..3 LOOP
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
            CASE i
                WHEN 1 THEN 'Understanding AI Basics'
                WHEN 2 THEN 'Machine Learning Fundamentals'
                WHEN 3 THEN 'Neural Networks Introduction'
            END,
            CASE i
                WHEN 1 THEN 'This lesson covers the fundamental concepts of artificial intelligence.'
                WHEN 2 THEN 'Learn about different types of machine learning algorithms.'
                WHEN 3 THEN 'Discover how neural networks mimic human brain function.'
            END,
            i
        ) ON CONFLICT (id) DO NOTHING;

        -- Add lesson progress for the demo student
        INSERT INTO public.lesson_progress (
            id,
            student_id,
            lesson_id,
            completed,
            completed_at,
            xp_earned
        ) VALUES (
            gen_random_uuid(),
            demo_student_uuid,
            demo_lesson_uuid,
            i < 3, -- First two lessons completed
            CASE WHEN i < 3 THEN NOW() ELSE NULL END,
            CASE WHEN i < 3 THEN 100 ELSE NULL END
        ) ON CONFLICT (id) DO NOTHING;

        -- Add quiz questions
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
            CASE i
                WHEN 1 THEN 'What is artificial intelligence?'
                WHEN 2 THEN 'Which is NOT a type of machine learning?'
                WHEN 3 THEN 'What is a neural network modeled after?'
            END,
            'multiple_choice',
            CASE i
                WHEN 1 THEN '["A computer program that can think", "The simulation of human intelligence by machines", "A robot", "A database system"]'::jsonb
                WHEN 2 THEN '["Supervised learning", "Unsupervised learning", "Manual learning", "Reinforcement learning"]'::jsonb
                WHEN 3 THEN '["The human brain", "A computer processor", "A database", "A calculator"]'::jsonb
            END,
            CASE i
                WHEN 1 THEN 1
                WHEN 2 THEN 2
                WHEN 3 THEN 0
            END
        ) ON CONFLICT (id) DO NOTHING;
    END LOOP;

END $$; 
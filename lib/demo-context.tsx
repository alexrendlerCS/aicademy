"use client";

import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";
import { supabase } from "./supabaseClient";

interface DemoContextType {
  isDemo: boolean;
  demoRole: "student" | "teacher" | null;
}

const DemoContext = createContext<DemoContextType>({
  isDemo: false,
  demoRole: null,
});

export function DemoProvider({ children }: { children: ReactNode }) {
  const [isDemo, setIsDemo] = useState(false);
  const [demoRole, setDemoRole] = useState<"student" | "teacher" | null>(null);

  useEffect(() => {
    const checkDemoStatus = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Check for static demo emails
      const isDemoUser =
        user?.email === "demo.student@aicademy.edu" ||
        user?.email === "demo.teacher@aicademy.edu";

      if (isDemoUser) {
        setIsDemo(true);
        setDemoRole(user.user_metadata.role as "student" | "teacher");
      } else {
        setIsDemo(false);
        setDemoRole(null);
      }
    };

    checkDemoStatus();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN") {
        const user = session?.user;
        // Check for static demo emails
        const isDemoUser =
          user?.email === "demo.student@aicademy.edu" ||
          user?.email === "demo.teacher@aicademy.edu";

        if (isDemoUser) {
          setIsDemo(true);
          setDemoRole(user.user_metadata.role as "student" | "teacher");
        } else {
          setIsDemo(false);
          setDemoRole(null);
        }
      }
      if (event === "SIGNED_OUT") {
        setIsDemo(false);
        setDemoRole(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <DemoContext.Provider value={{ isDemo, demoRole }}>
      {children}
    </DemoContext.Provider>
  );
}

export const useDemo = () => useContext(DemoContext);

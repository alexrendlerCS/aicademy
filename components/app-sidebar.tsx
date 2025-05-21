"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  BarChart,
  PlusCircle,
  Home,
  BookOpenCheck,
  GraduationCap,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ModeToggle } from "@/components/mode-toggle";
import { cn } from "@/lib/utils";

interface AppSidebarProps {
  userType: "teacher" | "student";
  userName: string;
}

export function AppSidebar({ userType, userName }: AppSidebarProps) {
  const pathname = usePathname();

  const teacherMenuItems = [
    {
      title: "Dashboard",
      icon: Home,
      href: "/teacher",
    },
    {
      title: "My Modules",
      icon: BookOpen,
      href: "/teacher/modules",
    },
    {
      title: "Classes",
      icon: GraduationCap,
      href: "/teacher/classes",
    },
    {
      title: "Create Module",
      icon: PlusCircle,
      href: "/teacher/modules/create",
    },
    {
      title: "Student Progress",
      icon: BarChart,
      href: "/teacher/progress",
    },
  ];

  const studentMenuItems = [
    {
      title: "Dashboard",
      icon: Home,
      href: "/student",
    },
    {
      title: "My Modules",
      icon: BookOpen,
      href: "/student/modules",
    },
    {
      title: "Completed Modules",
      icon: BookOpenCheck,
      href: "/student/completed",
    },
  ];

  const menuItems =
    userType === "teacher" ? teacherMenuItems : studentMenuItems;

  return (
    <Sidebar>
      <SidebarHeader className="flex flex-col items-center justify-center py-6">
        <div className="flex items-center space-x-2">
          <GraduationCap className="h-8 w-8 text-primary" />
          <h1 className="text-xl font-bold">EduAI</h1>
        </div>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={item.title}
              >
                <Link href={item.href}>
                  <item.icon
                    className={cn(
                      "mr-2",
                      pathname === item.href ? "text-primary" : ""
                    )}
                  />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="mt-auto">
        <SidebarSeparator />
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={`/placeholder.svg?height=40&width=40`} />
              <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{userName}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {userType}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <ModeToggle />
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

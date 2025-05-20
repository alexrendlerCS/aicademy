import type React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset } from "@/components/ui/sidebar"

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <AppSidebar userType="teacher" userName="Ms. Johnson" />
      <SidebarInset>
        <div className="container py-6 max-w-7xl">{children}</div>
      </SidebarInset>
    </div>
  )
}

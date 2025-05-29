"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";
import { useState } from "react";
import { DemoModal } from "@/components/demo-modal";

export default function Home() {
  const [showDemoModal, setShowDemoModal] = useState(false);

  return (
    <div className="flex min-h-screen flex-col items-center w-full">
      <header className="w-full px-4 lg:px-6 h-14 flex items-center justify-between max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <GraduationCap className="h-6 w-6 text-primary" />
          <span>AIcademy</span>
        </Link>
        <nav className="flex gap-4 sm:gap-6">
          <Link
            href="#features"
            className="text-sm font-medium hover:underline underline-offset-4"
          >
            Features
          </Link>
          <Link
            href="#about"
            className="text-sm font-medium hover:underline underline-offset-4"
          >
            About
          </Link>
          <Link
            href="#contact"
            className="text-sm font-medium hover:underline underline-offset-4"
          >
            Contact
          </Link>
        </nav>
      </header>
      <main className="flex-1 w-full">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container mx-auto px-4 md:px-6 max-w-7xl">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                    AI-Enhanced Learning for the Modern Classroom
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Transform education with our innovative AI learning
                    platform. Empower educators and students to harness AI for
                    deeper understanding, critical thinking, and personalized
                    learning experiences.
                  </p>
                </div>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2 min-[400px]:flex-row">
                    <Link href="/login?role=teacher">
                      <Button
                        size="lg"
                        variant="outline"
                        className="w-full border-orange-500 hover:bg-orange-50 hover:text-orange-600 transition-colors duration-200"
                      >
                        Teacher Login
                      </Button>
                    </Link>
                    <Link href="/login?role=student">
                      <Button
                        size="lg"
                        variant="outline"
                        className="w-full border-orange-500 hover:bg-orange-50 hover:text-orange-600 transition-colors duration-200"
                      >
                        Student Login
                      </Button>
                    </Link>
                    <Button
                      size="lg"
                      onClick={() => setShowDemoModal(true)}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 font-semibold relative overflow-hidden group"
                    >
                      <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-orange-400 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                      <span className="relative flex items-center justify-center gap-2">
                        Try Demo
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="animate-pulse"
                        >
                          <path d="M5 12h14" />
                          <path d="m12 5 7 7-7 7" />
                        </svg>
                      </span>
                    </Button>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Don't have an account?{" "}
                    <Link
                      href="/signup"
                      className="text-primary hover:underline"
                    >
                      Sign up here!
                    </Link>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <img
                  src="/logo.png?height=550&width=550"
                  alt="Educational platform dashboard"
                  className="rounded-lg object-cover"
                  width={550}
                  height={550}
                />
              </div>
            </div>
          </div>
        </section>

        <section
          id="features"
          className="w-full py-12 md:py-24 lg:py-32 bg-muted"
        >
          <div className="container mx-auto px-4 md:px-6 max-w-7xl">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Platform Features
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our platform offers comprehensive tools for educators and
                  learners across all academic levels.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-6 py-12">
              <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <GraduationCap className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold">Adaptive Learning Paths</h3>
                  <p className="text-center text-muted-foreground">
                    Personalized learning experiences that adapt to each
                    student's level and learning style, ensuring optimal
                    educational outcomes.
                  </p>
                </div>
                <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-6 w-6"
                    >
                      <path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z" />
                      <path d="M10 2c1 .5 2 2 2 5" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold">
                    AI-Powered Learning Assistant
                  </h3>
                  <p className="text-center text-muted-foreground">
                    Intelligent AI assistance that promotes critical thinking
                    and deeper understanding, while teaching responsible AI
                    usage in academic settings.
                  </p>
                </div>
                <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-6 w-6"
                    >
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold">Progress Tracking</h3>
                  <p className="text-center text-muted-foreground">
                    Monitor student progress with detailed analytics and
                    performance metrics.
                  </p>
                </div>
              </div>
              <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-2">
                <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-6 w-6"
                    >
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold">Gamification</h3>
                  <p className="text-center text-muted-foreground">
                    Engage students with XP, levels, and achievements to make
                    learning fun and rewarding.
                  </p>
                </div>
                <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-6 w-6"
                    >
                      <rect width="18" height="18" x="3" y="3" rx="2" />
                      <path d="M7 7h10" />
                      <path d="M7 12h10" />
                      <path d="M7 17h10" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold">Customizable Content</h3>
                  <p className="text-center text-muted-foreground">
                    Create rich content with text, images, videos, and
                    interactive elements.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <DemoModal
        isOpen={showDemoModal}
        onClose={() => setShowDemoModal(false)}
      />
      <footer className="w-full border-t">
        <div className="max-w-7xl mx-auto flex flex-col gap-2 sm:flex-row py-6 items-center px-4 md:px-6">
          <p className="text-xs text-muted-foreground">
            © 2025 Aicademy. All rights reserved.
          </p>
          <nav className="sm:ml-auto flex gap-4 sm:gap-6">
            <Link
              href="#"
              className="text-xs hover:underline underline-offset-4"
            >
              Terms of Service
            </Link>
            <Link
              href="#"
              className="text-xs hover:underline underline-offset-4"
            >
              Privacy
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

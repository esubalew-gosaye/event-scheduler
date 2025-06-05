import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CalendarIcon, ClockIcon, UserIcon } from "lucide-react"

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-white border-b border-gray-200 py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Event Scheduler</h1>
          <div className="flex gap-4">
            <Link href="/login">
              <Button variant="outline">Log in</Button>
            </Link>
            <Link href="/register">
              <Button>Sign up</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="bg-gradient-to-b from-white to-gray-50 py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Organize Your Schedule with Ease</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
              Create, manage, and track your events with powerful recurrence options and intuitive calendar views.
            </p>
            <Link href="/register">
              <Button size="lg" className="px-8">
                Get Started
              </Button>
            </Link>
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-gray-50 p-6 rounded-lg text-center">
                <div className="bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <CalendarIcon className="text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Flexible Scheduling</h3>
                <p className="text-gray-600">
                  Create one-time events or set up complex recurring patterns to fit your needs.
                </p>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg text-center">
                <div className="bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <ClockIcon className="text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Multiple Views</h3>
                <p className="text-gray-600">Switch between calendar and list views to visualize your schedule.</p>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg text-center">
                <div className="bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <UserIcon className="text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Personal Accounts</h3>
                <p className="text-gray-600">
                  Secure access to your events with user authentication and account management.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-100 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; {new Date().getFullYear()} Event Scheduler. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

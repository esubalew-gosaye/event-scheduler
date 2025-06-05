"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { CalendarIcon, ListIcon, LogOutIcon, PlusIcon, UserIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export function DashboardNav() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const navItems = [
    {
      label: "Calendar",
      href: "/dashboard",
      icon: CalendarIcon,
      active: pathname === "/dashboard",
    },
    {
      label: "List",
      href: "/dashboard/list",
      icon: ListIcon,
      active: pathname === "/dashboard/list",
    },
    {
      label: "Profile",
      href: "/dashboard/profile",
      icon: UserIcon,
      active: pathname === "/dashboard/profile",
    },
  ]

  return (
    <header className="bg-white border-b border-gray-200 py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/dashboard" className="text-2xl font-bold text-gray-900">
          Event Scheduler
        </Link>

        <nav className="hidden md:flex items-center space-x-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center space-x-1 text-sm font-medium",
                item.active ? "text-primary" : "text-gray-600 hover:text-gray-900",
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="flex items-center space-x-4">
          <Link href="/dashboard/new-event">
            <Button size="sm" className="hidden md:flex items-center space-x-1">
              <PlusIcon className="h-4 w-4" />
              <span>New Event</span>
            </Button>
          </Link>

          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="flex items-center space-x-1 text-gray-600 hover:text-gray-900"
          >
            <LogOutIcon className="h-4 w-4" />
            <span className="hidden md:inline">Logout</span>
          </Button>

          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium hidden md:inline">{user?.username}</span>
          </div>
        </div>
      </div>
    </header>
  )
}

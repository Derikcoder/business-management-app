"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  Home,
  Users,
  Calendar,
  FileText,
  FileText as FileInvoice,
  Settings,
  Building2,
  Menu,
  LogOut,
  User,
  ChevronDown,
  ArrowLeft,
  ChevronRight,
} from "lucide-react"
import { UserRole } from "@prisma/client"

// Define types for navigation and breadcrumbs
interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  adminOnly?: boolean
}

interface BreadcrumbItem {
  name: string
  href: string | null
}

interface DashboardLayoutProps {
  children: React.ReactNode
}

// Funksie om broodkrummels van padnaam te genereer
const generateBreadcrumbs = (pathname: string): BreadcrumbItem[] => {
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs: BreadcrumbItem[] = []
  
  // Begin altyd met Dashboard
  breadcrumbs.push({ name: 'Dashboard', href: '/dashboard' })
  
  if (segments.length > 1) {
    const pathSegments = segments.slice(1) // Remove 'dashboard'
    let currentPath = '/dashboard'
    
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`
      
      // Karteer segment name na leesbare etikette
      const labelMap: { [key: string]: string } = {
        'customers': 'Customers',
        'quotes': 'Quotes',
        'invoices': 'Invoices',
        'service-calls': 'Service Calls',
        'team': 'Team Management',
        'business': 'Business',
        'register': 'Register',
        'settings': 'Settings',
      }
      
      const label = labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
      
      // Moenie skakel byvoeg vir die laaste segment nie (huidige bladsy)
      if (index === pathSegments.length - 1) {
        breadcrumbs.push({ name: label, href: null })
      } else {
        breadcrumbs.push({ name: label, href: currentPath })
      }
    })
  }
  
  return breadcrumbs
}

const navigation: NavigationItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    name: "Customers",
    href: "/dashboard/customers",
    icon: Users,
  },
  {
    name: "Service Calls",
    href: "/dashboard/service-calls",
    icon: Calendar,
  },
  {
    name: "Quotes",
    href: "/dashboard/quotes",
    icon: FileText,
  },
  {
    name: "Invoices",
    href: "/dashboard/invoices",
    icon: FileInvoice,
  },
  {
    name: "Team",
    href: "/dashboard/team",
    icon: Users,
    adminOnly: true,
  },
  {
    name: "Business Settings",
    href: "/dashboard/business/settings",
    icon: Building2,
  },
]

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Genereer broodkrummels
  const breadcrumbs = generateBreadcrumbs(pathname)
  const showBackButton = breadcrumbs.length > 1
  
  // Terug knoppie hanteerder
  const handleBack = () => {
    if (breadcrumbs.length > 1) {
      const previousBreadcrumb = breadcrumbs[breadcrumbs.length - 2]
      if (previousBreadcrumb.href) {
        router.push(previousBreadcrumb.href)
      } else {
        router.back()
      }
    } else {
      router.back()
    }
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    router.push("/auth/signin")
    return null
  }

  const filteredNavigation = navigation.filter((item) => {
    if (item.adminOnly && session.user.role !== UserRole.SUPER_ADMIN) {
      return false
    }
    return true
  })

  const handleSignOut = async () => {
    router.push("/auth/signout")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar for desktop */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-white">
          <div className="flex h-16 flex-shrink-0 items-center px-4 border-b border-gray-200">
            <Building2 className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-lg font-semibold text-gray-900">
              Quote & Invoice System
            </span>
          </div>
          <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {filteredNavigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      isActive
                        ? "bg-blue-100 text-blue-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                      "group flex items-center px-2 py-2 text-sm font-medium rounded-md"
                    )}
                  >
                    <item.icon
                      className={cn(
                        isActive ? "text-blue-500" : "text-gray-400 group-hover:text-gray-500",
                        "mr-3 flex-shrink-0 h-6 w-6"
                      )}
                    />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
          <div className="flex flex-shrink-0 border-t border-gray-200 p-4">
            <div className="group block w-full flex-shrink-0">
              <div className="flex items-center">
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                    {session.user.name}
                  </p>
                  <p className="text-xs text-gray-500 group-hover:text-gray-700">
                    {session.user.businessName || session.user.email}
                  </p>
                  <Badge variant="outline" className="text-xs mt-1">
                    {session.user.role === UserRole.SUPER_ADMIN ? "Super Admin" : "Field Operator"}
                  </Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="mt-2 w-full justify-start"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-white">
            <div className="flex h-16 flex-shrink-0 items-center px-4 border-b border-gray-200">
              <Building2 className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-lg font-semibold text-gray-900">
                Quote & Invoice System
              </span>
            </div>
            <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
              <nav className="mt-5 flex-1 px-2 space-y-1">
                {filteredNavigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        isActive
                          ? "bg-blue-100 text-blue-900"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                        "group flex items-center px-2 py-2 text-sm font-medium rounded-md"
                      )}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon
                        className={cn(
                          isActive ? "text-blue-500" : "text-gray-400 group-hover:text-gray-500",
                          "mr-3 flex-shrink-0 h-6 w-6"
                        )}
                      />
                      {item.name}
                    </Link>
                  )
                })}
              </nav>
            </div>
            <div className="flex flex-shrink-0 border-t border-gray-200 p-4">
              <div className="group block w-full flex-shrink-0">
                <div className="flex items-center">
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                      {session.user.name}
                    </p>
                    <p className="text-xs text-gray-500 group-hover:text-gray-700">
                      {session.user.businessName || session.user.email}
                    </p>
                    <Badge variant="outline" className="text-xs mt-1">
                      {session.user.role === UserRole.SUPER_ADMIN ? "Super Admin" : "Field Operator"}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="mt-2 w-full justify-start"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        {/* Mobile header */}
        <div className="sticky top-0 z-10 md:hidden bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
            </Sheet>
            <div className="flex items-center">
              <Building2 className="h-6 w-6 text-blue-600" />
              <span className="ml-2 text-sm font-semibold text-gray-900">
                Quote & Invoice System
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                {session.user.role === UserRole.SUPER_ADMIN ? "Super Admin" : "Field Operator"}
              </Badge>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Breadcrumb Navigation */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {showBackButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="p-1 h-8 w-8"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              
              <nav className="flex items-center space-x-1 text-sm text-gray-500">
                {breadcrumbs.map((breadcrumb, index) => (
                  <div key={breadcrumb.name} className="flex items-center">
                    {index > 0 && (
                      <ChevronRight className="h-4 w-4 mx-1 text-gray-400" />
                    )}
                    {breadcrumb.href ? (
                      <Link
                        href={breadcrumb.href}
                        className="hover:text-gray-700 hover:underline"
                      >
                        {breadcrumb.name}
                      </Link>
                    ) : (
                      <span className="text-gray-900 font-medium">
                        {breadcrumb.name}
                      </span>
                    )}
                  </div>
                ))}
              </nav>
            </div>
            
            {/* Quick access to main navigation on mobile */}
            <div className="md:hidden">
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Menu className="h-4 w-4 mr-1" />
                    Menu
                  </Button>
                </SheetTrigger>
              </Sheet>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
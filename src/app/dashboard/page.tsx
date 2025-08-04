"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Building2, Users, FileText, Calendar, Settings, Plus } from "lucide-react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"

function DashboardContent() {
  const { data: session } = useSession()
  const router = useRouter()
  const [hasBusiness, setHasBusiness] = useState(false)

  useEffect(() => {
    if (session) {
      setHasBusiness(!!session.user.businessId)
    }
  }, [session])

  if (!session) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {session.user.name}!
        </h1>
        <p className="text-gray-600">
          {session.user.businessName 
            ? `Managing ${session.user.businessName}`
            : "Get started by setting up your business"
          }
        </p>
      </div>

      {!hasBusiness && (
        <Alert className="mb-8">
          <Building2 className="h-4 w-4" />
          <AlertDescription>
            You need to register your business before you can start creating quotes and managing customers.
            <Link href="/dashboard/business/register">
              <Button className="ml-4" size="sm">
                Register Business
              </Button>
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {!hasBusiness ? (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Business Setup
              </CardTitle>
              <CardDescription>
                Register your business to get started with the quote and invoice management system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/business/register">
                <Button className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Register Your Business
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Customers
                </CardTitle>
                <CardDescription>
                  Manage your customer database
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/dashboard/customers">
                  <Button className="w-full">
                    Manage Customers
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Service Calls
                </CardTitle>
                <CardDescription>
                  Schedule and track service visits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/dashboard/service-calls">
                  <Button className="w-full">
                    Service Calls
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Quotes
                </CardTitle>
                <CardDescription>
                  Create and manage quotes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/dashboard/quotes">
                  <Button className="w-full">
                    Manage Quotes
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Invoices
                </CardTitle>
                <CardDescription>
                  Generate and track invoices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/dashboard/invoices">
                  <Button className="w-full">
                    Manage Invoices
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Members
                </CardTitle>
                <CardDescription>
                  Manage field operators and staff
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/dashboard/team">
                  <Button className="w-full">
                    Manage Team
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Business Settings
                </CardTitle>
                <CardDescription>
                  Update business information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/dashboard/business/settings">
                  <Button className="w-full" variant="outline">
                    Business Settings
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}

export default function Dashboard() {
  return (
    <DashboardLayout>
      <DashboardContent />
    </DashboardLayout>
  )
}
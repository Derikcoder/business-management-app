import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Users, Settings, Zap } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-8">
            <div className="relative w-24 h-24 md:w-32 md:h-32">
              <Zap className="w-full h-full text-blue-600" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Quote & Invoice Management System
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Professional solution for backup power generating unit services. 
            Create quotes, manage customers, and generate invoices with ease.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/auth/signin">
              <Button size="lg" className="text-lg px-8 py-3">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button variant="outline" size="lg" className="text-lg px-8 py-3">
                Sign Up
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center">
            <CardHeader>
              <FileText className="w-12 h-12 mx-auto text-blue-600 mb-4" />
              <CardTitle>Professional Quotes</CardTitle>
              <CardDescription>
                Create detailed quotes for backup power services with itemized costs and deposit requirements
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="w-12 h-12 mx-auto text-green-600 mb-4" />
              <CardTitle>Customer Management</CardTitle>
              <CardDescription>
                Manage residential, commercial, and industrial customers with comprehensive profiles
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Settings className="w-12 h-12 mx-auto text-purple-600 mb-4" />
              <CardTitle>Service Tracking</CardTitle>
              <CardDescription>
                Track service calls from initial visit to final invoicing with actual cost tracking
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Perfect for Backup Power Services
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-lg mb-2">Residential Customers</h3>
              <p className="text-gray-600">Home backup power systems and generator maintenance services</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-lg mb-2">Commercial Clients</h3>
              <p className="text-gray-600">Pharmacies, restaurants, retail shops, and business continuity solutions</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-lg mb-2">Industrial Facilities</h3>
              <p className="text-gray-600">Farms, factories, mines, and large-scale power backup systems</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Loader2, Calendar as CalendarIcon, Plus, Search, Clock, MapPin, User, CheckCircle, XCircle } from "lucide-react"
import { format } from "date-fns"
import { ServiceCallStatus, UserRole } from "@prisma/client"

interface ServiceCall {
  id: string
  title: string
  description: string | null
  status: ServiceCallStatus
  scheduledAt: string | null
  completedAt: string | null
  address: string | null
  notes: string | null
  customer: {
    id: string
    name: string
    type: string
  }
  assignedTo: {
    id: string
    name: string | null
    email: string
  } | null
  createdAt: string
}

interface TeamMember {
  id: string
  name: string | null
  email: string
}

interface Customer {
  id: string
  name: string
  type: string
}

export default function ServiceCallManagement() {
  const { data: session } = useSession()
  const router = useRouter()
  const [serviceCalls, setServiceCalls] = useState<ServiceCall[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    customerId: "",
    assignedToId: "",
    scheduledAt: "",
    address: "",
    notes: "",
  })
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!session) {
      router.push("/auth/signin")
      return
    }

    if (!session.user.businessId) {
      router.push("/dashboard/business/register")
      return
    }

    fetchServiceCalls()
    fetchCustomers()
    fetchTeamMembers()
  }, [session, router])

  const fetchServiceCalls = async () => {
    try {
      const response = await fetch("/api/service-calls")
      if (response.ok) {
        const data = await response.json()
        setServiceCalls(data.serviceCalls)
      }
    } catch (error) {
      console.error("Error fetching service calls:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/customers")
      if (response.ok) {
        const data = await response.json()
        setCustomers(data.customers)
      }
    } catch (error) {
      console.error("Error fetching customers:", error)
    }
  }

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch("/api/team/members")
      if (response.ok) {
        const data = await response.json()
        setTeamMembers(data.members)
      }
    } catch (error) {
      console.error("Error fetching team members:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      const response = await fetch("/api/service-calls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setFormData({
          title: "",
          description: "",
          customerId: "",
          assignedToId: "",
          scheduledAt: "",
          address: "",
          notes: "",
        })
        setIsDialogOpen(false)
        fetchServiceCalls()
      } else {
        const data = await response.json()
        setError(data.error || "Failed to create service call")
      }
    } catch (error) {
      setError("An error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusBadgeColor = (status: ServiceCallStatus) => {
    switch (status) {
      case ServiceCallStatus.PENDING:
        return "bg-gray-100 text-gray-800"
      case ServiceCallStatus.SCHEDULED:
        return "bg-blue-100 text-blue-800"
      case ServiceCallStatus.IN_PROGRESS:
        return "bg-yellow-100 text-yellow-800"
      case ServiceCallStatus.COMPLETED:
        return "bg-green-100 text-green-800"
      case ServiceCallStatus.CANCELLED:
        return "bg-red-100 text-red-800"
    }
  }

  const filteredServiceCalls = serviceCalls.filter(serviceCall => {
    const matchesSearch = serviceCall.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         serviceCall.customer.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || serviceCall.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Service Calls</h1>
            <p className="text-gray-600">Schedule and track quotation site visits and service calls</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Schedule Service Call
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Schedule Service Call</DialogTitle>
                <DialogDescription>
                  Create a new service call for quotation site visit
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Service Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    placeholder="e.g., Backup Power Assessment"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the service requirements"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerId">Customer *</Label>
                    <Select value={formData.customerId} onValueChange={(value) => setFormData({ ...formData, customerId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assignedToId">Assign To</Label>
                    <Select value={formData.assignedToId} onValueChange={(value) => setFormData({ ...formData, assignedToId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select team member" />
                      </SelectTrigger>
                      <SelectContent>
                        {teamMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name || member.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scheduledAt">Scheduled Date & Time</Label>
                  <Input
                    id="scheduledAt"
                    name="scheduledAt"
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Service Address</Label>
                  <Textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Enter service location (leave blank to use customer address)"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any additional information"
                    rows={3}
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-4 pt-4">
                  <Button type="submit" className="flex-1" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Scheduling...
                      </>
                    ) : (
                      "Schedule Service Call"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search service calls..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value={ServiceCallStatus.PENDING}>Pending</SelectItem>
              <SelectItem value={ServiceCallStatus.SCHEDULED}>Scheduled</SelectItem>
              <SelectItem value={ServiceCallStatus.IN_PROGRESS}>In Progress</SelectItem>
              <SelectItem value={ServiceCallStatus.COMPLETED}>Completed</SelectItem>
              <SelectItem value={ServiceCallStatus.CANCELLED}>Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Service Calls ({filteredServiceCalls.length})
            </CardTitle>
            <CardDescription>
              Track all your service calls and quotation site visits
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredServiceCalls.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {serviceCalls.length === 0 ? "No service calls yet" : "No service calls found"}
                </h3>
                <p className="text-gray-600 mb-4">
                  {serviceCalls.length === 0 
                    ? "Schedule your first service call to get started" 
                    : "Try adjusting your search or filter criteria"
                  }
                </p>
                {serviceCalls.length === 0 && (
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Schedule Service Call
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredServiceCalls.map((serviceCall) => (
                    <TableRow key={serviceCall.id}>
                      <TableCell className="font-medium">
                        {serviceCall.title}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{serviceCall.customer.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {serviceCall.customer.type}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(serviceCall.status)}>
                          {serviceCall.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {serviceCall.scheduledAt ? (
                          format(new Date(serviceCall.scheduledAt), "MMM dd, yyyy HH:mm")
                        ) : (
                          "Not scheduled"
                        )}
                      </TableCell>
                      <TableCell>
                        {serviceCall.assignedTo ? (
                          serviceCall.assignedTo.name || serviceCall.assignedTo.email
                        ) : (
                          "Unassigned"
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {serviceCall.status === ServiceCallStatus.PENDING && (
                            <Button size="sm" variant="outline">
                              Schedule
                            </Button>
                          )}
                          {serviceCall.status === ServiceCallStatus.SCHEDULED && (
                            <Button size="sm" variant="outline">
                              Start
                            </Button>
                          )}
                          {serviceCall.status === ServiceCallStatus.IN_PROGRESS && (
                            <Button size="sm" variant="outline">
                              Complete
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
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
import { Separator } from "@/components/ui/separator"
import { Loader2, FileText, Plus, Search, DollarSign, Calendar as CalendarIcon, Eye, Edit, Send } from "lucide-react"
import { format } from "date-fns"
import { QuoteStatus, CustomerType } from "@prisma/client"

interface Quote {
  id: string
  quoteNumber: string
  title: string
  description: string | null
  status: QuoteStatus
  subtotal: number
  taxRate: number
  taxAmount: number
  total: number
  depositRequired: number
  depositPaid: number
  validUntil: string | null
  acceptedAt: string | null
  createdAt: string
  customer: {
    id: string
    name: string
    type: CustomerType
  }
  createdBy: {
    id: string
    name: string | null
    email: string
  }
}

interface Customer {
  id: string
  name: string
  type: CustomerType
}

interface QuoteItem {
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export default function QuoteManagement() {
  const { data: session } = useSession()
  const router = useRouter()
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    customerId: "",
    validUntil: "",
    depositRequired: 0,
    taxRate: 0.15,
    items: [
      { description: "", quantity: 1, unitPrice: 0, totalPrice: 0 }
    ] as QuoteItem[]
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

    fetchQuotes()
    fetchCustomers()
  }, [session, router])

  const fetchQuotes = async () => {
    try {
      const response = await fetch("/api/quotes")
      if (response.ok) {
        const data = await response.json()
        setQuotes(data.quotes)
      }
    } catch (error) {
      console.error("Error fetching quotes:", error)
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

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: "", quantity: 1, unitPrice: 0, totalPrice: 0 }]
    })
  }

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index)
      setFormData({
        ...formData,
        items: newItems
      })
    }
  }

  const updateItem = (index: number, field: keyof QuoteItem, value: string | number) => {
    const newItems = [...formData.items]
    newItems[index] = { ...newItems[index], [field]: value }
    
    // Calculate total price when quantity or unit price changes
    if (field === "quantity" || field === "unitPrice") {
      newItems[index].totalPrice = Number(newItems[index].quantity) * Number(newItems[index].unitPrice)
    }
    
    setFormData({
      ...formData,
      items: newItems
    })
  }

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.totalPrice, 0)
    const taxAmount = subtotal * formData.taxRate
    const total = subtotal + taxAmount
    
    return { subtotal, taxAmount, total }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      const { subtotal, taxAmount, total } = calculateTotals()
      
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          subtotal,
          taxAmount,
          total,
          depositRequired: formData.depositRequired || 0
        }),
      })

      if (response.ok) {
        setFormData({
          title: "",
          description: "",
          customerId: "",
          validUntil: "",
          depositRequired: 0,
          taxRate: 0.15,
          items: [{ description: "", quantity: 1, unitPrice: 0, totalPrice: 0 }]
        })
        setIsDialogOpen(false)
        fetchQuotes()
      } else {
        const data = await response.json()
        setError(data.error || "Failed to create quote")
      }
    } catch (error) {
      setError("An error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusBadgeColor = (status: QuoteStatus) => {
    switch (status) {
      case QuoteStatus.DRAFT:
        return "bg-gray-100 text-gray-800"
      case QuoteStatus.SENT:
        return "bg-blue-100 text-blue-800"
      case QuoteStatus.ACCEPTED:
        return "bg-green-100 text-green-800"
      case QuoteStatus.REJECTED:
        return "bg-red-100 text-red-800"
      case QuoteStatus.EXPIRED:
        return "bg-orange-100 text-orange-800"
      case QuoteStatus.CONVERTED_TO_INVOICE:
        return "bg-purple-100 text-purple-800"
    }
  }

  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = quote.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quote.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quote.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || quote.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const { subtotal, taxAmount, total } = calculateTotals()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Quotes</h1>
            <p className="text-gray-600">Create and manage professional quotes for your customers</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Quote
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Quote</DialogTitle>
                <DialogDescription>
                  Generate a professional quote for your customer
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Quote Title *</Label>
                    <Input
                      id="title"
                      name="title"
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      placeholder="e.g., Backup Power System Installation"
                    />
                  </div>

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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the scope of work"
                    rows={3}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Quote Items</h3>
                    <Button type="button" variant="outline" size="sm" onClick={addItem}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Item
                    </Button>
                  </div>
                  
                  {formData.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-5 space-y-2">
                        <Label htmlFor={`item-${index}`}>Description</Label>
                        <Input
                          id={`item-${index}`}
                          value={item.description}
                          onChange={(e) => updateItem(index, "description", e.target.value)}
                          placeholder="Item description"
                          required
                        />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor={`qty-${index}`}>Qty</Label>
                        <Input
                          id={`qty-${index}`}
                          type="number"
                          min="1"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value) || 0)}
                          required
                        />
                      </div>
                      <div className="col-span-3 space-y-2">
                        <Label htmlFor={`price-${index}`}>Unit Price</Label>
                        <Input
                          id={`price-${index}`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                          required
                        />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label>Total</Label>
                        <Input
                          value={`$${item.totalPrice.toFixed(2)}`}
                          readOnly
                          className="bg-gray-50"
                        />
                      </div>
                      <div className="col-span-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeItem(index)}
                          disabled={formData.items.length === 1}
                          className="w-full"
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="taxRate">Tax Rate (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.taxRate * 100}
                      onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) / 100 })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="depositRequired">Deposit Required ($)</Label>
                    <Input
                      id="depositRequired"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.depositRequired}
                      onChange={(e) => setFormData({ ...formData, depositRequired: parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="validUntil">Valid Until</Label>
                    <Input
                      id="validUntil"
                      type="date"
                      value={formData.validUntil}
                      onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax ({(formData.taxRate * 100).toFixed(1)}%):</span>
                    <span>${taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                  {formData.depositRequired > 0 && (
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Deposit Required:</span>
                      <span>${formData.depositRequired.toFixed(2)}</span>
                    </div>
                  )}
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
                        Creating Quote...
                      </>
                    ) : (
                      "Create Quote"
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
              placeholder="Search quotes..."
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
              <SelectItem value={QuoteStatus.DRAFT}>Draft</SelectItem>
              <SelectItem value={QuoteStatus.SENT}>Sent</SelectItem>
              <SelectItem value={QuoteStatus.ACCEPTED}>Accepted</SelectItem>
              <SelectItem value={QuoteStatus.REJECTED}>Rejected</SelectItem>
              <SelectItem value={QuoteStatus.EXPIRED}>Expired</SelectItem>
              <SelectItem value={QuoteStatus.CONVERTED_TO_INVOICE}>Converted</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Quotes ({filteredQuotes.length})
            </CardTitle>
            <CardDescription>
              Manage all your customer quotes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredQuotes.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {quotes.length === 0 ? "No quotes yet" : "No quotes found"}
                </h3>
                <p className="text-gray-600 mb-4">
                  {quotes.length === 0 
                    ? "Create your first quote to get started" 
                    : "Try adjusting your search or filter criteria"
                  }
                </p>
                {quotes.length === 0 && (
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Quote
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quote #</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Valid Until</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuotes.map((quote) => (
                    <TableRow key={quote.id}>
                      <TableCell className="font-mono text-sm">
                        {quote.quoteNumber}
                      </TableCell>
                      <TableCell className="font-medium">
                        {quote.title}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{quote.customer.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {quote.customer.type}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(quote.status)}>
                          {quote.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        ${quote.total.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {quote.validUntil ? (
                          format(new Date(quote.validUntil), "MMM dd, yyyy")
                        ) : (
                          "No expiry"
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                          {quote.status === QuoteStatus.DRAFT && (
                            <>
                              <Button size="sm" variant="outline">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Send className="w-4 h-4" />
                              </Button>
                            </>
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
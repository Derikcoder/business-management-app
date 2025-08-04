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
import { Loader2, FileText, Plus, Search, DollarSign, Calendar as CalendarIcon, Eye, Download } from "lucide-react"
import { format } from "date-fns"
import { InvoiceStatus, QuoteStatus, CustomerType } from "@prisma/client"

interface Invoice {
  id: string
  invoiceNumber: string
  title: string
  description: string | null
  status: InvoiceStatus
  subtotal: number
  taxRate: number
  taxAmount: number
  total: number
  depositPaid: number
  balanceDue: number
  actualTravelCost: number
  actualLabourHours: number
  actualLabourRate: number
  actualPartsCost: number
  issuedAt: string | null
  dueAt: string | null
  paidAt: string | null
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
  quote?: {
    id: string
    quoteNumber: string
    title: string
  }
}

interface Quote {
  id: string
  quoteNumber: string
  title: string
  status: QuoteStatus
  total: number
  depositPaid: number
  customer: {
    id: string
    name: string
    type: CustomerType
  }
}

interface InvoiceItem {
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export default function InvoiceManagement() {
  const { data: session } = useSession()
  const router = useRouter()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [formData, setFormData] = useState({
    quoteId: "",
    title: "",
    description: "",
    actualTravelCost: 0,
    actualLabourHours: 0,
    actualLabourRate: 0,
    actualPartsCost: 0,
    taxRate: 0.15,
    dueAt: "",
    items: [
      { description: "", quantity: 1, unitPrice: 0, totalPrice: 0 }
    ] as InvoiceItem[]
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

    fetchInvoices()
    fetchQuotes()
  }, [session, router])

  const fetchInvoices = async () => {
    try {
      const response = await fetch("/api/invoices")
      if (response.ok) {
        const data = await response.json()
        setInvoices(data.invoices)
      }
    } catch (error) {
      console.error("Error fetching invoices:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchQuotes = async () => {
    try {
      const response = await fetch("/api/quotes?convertible=true")
      if (response.ok) {
        const data = await response.json()
        setQuotes(data.quotes)
      }
    } catch (error) {
      console.error("Error fetching quotes:", error)
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

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...formData.items]
    newItems[index] = { ...newItems[index], [field]: value }
    
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
    const travelCost = formData.actualTravelCost || 0
    const labourCost = (formData.actualLabourHours || 0) * (formData.actualLabourRate || 0)
    const partsCost = formData.actualPartsCost || 0
    const actualSubtotal = subtotal + travelCost + labourCost + partsCost
    const taxAmount = actualSubtotal * formData.taxRate
    const total = actualSubtotal + taxAmount
    
    return { subtotal: actualSubtotal, taxAmount, total }
  }

  const handleQuoteSelect = (quoteId: string) => {
    const quote = quotes.find(q => q.id === quoteId)
    if (quote) {
      setFormData({
        ...formData,
        quoteId,
        title: quote.title,
        description: `Final invoice for ${quote.title}`,
        actualLabourRate: 50, // Default rate
        dueAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      const { subtotal, taxAmount, total } = calculateTotals()
      
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          subtotal,
          taxAmount,
          total,
          depositPaid: formData.quoteId ? quotes.find(q => q.id === formData.quoteId)?.depositPaid || 0 : 0
        }),
      })

      if (response.ok) {
        setFormData({
          quoteId: "",
          title: "",
          description: "",
          actualTravelCost: 0,
          actualLabourHours: 0,
          actualLabourRate: 0,
          actualPartsCost: 0,
          taxRate: 0.15,
          dueAt: "",
          items: [{ description: "", quantity: 1, unitPrice: 0, totalPrice: 0 }]
        })
        setIsDialogOpen(false)
        fetchInvoices()
      } else {
        const data = await response.json()
        setError(data.error || "Failed to create invoice")
      }
    } catch (error) {
      setError("An error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusBadgeColor = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.DRAFT:
        return "bg-gray-100 text-gray-800"
      case InvoiceStatus.ISSUED:
        return "bg-blue-100 text-blue-800"
      case InvoiceStatus.PARTIALLY_PAID:
        return "bg-yellow-100 text-yellow-800"
      case InvoiceStatus.PAID:
        return "bg-green-100 text-green-800"
      case InvoiceStatus.OVERDUE:
        return "bg-red-100 text-red-800"
      case InvoiceStatus.CANCELLED:
        return "bg-orange-100 text-orange-800"
    }
  }

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter
    
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Invoices</h1>
            <p className="text-gray-600">Generate and manage invoices from accepted quotes</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Invoice</DialogTitle>
                <DialogDescription>
                  Generate an invoice from an accepted quote or create a custom invoice
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="quoteId">Select Quote (Optional)</Label>
                  <Select value={formData.quoteId} onValueChange={handleQuoteSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a quote to convert" />
                    </SelectTrigger>
                    <SelectContent>
                      {quotes.map((quote) => (
                        <SelectItem key={quote.id} value={quote.id}>
                          {quote.quoteNumber} - {quote.title} (${quote.total.toFixed(2)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Invoice Title *</Label>
                    <Input
                      id="title"
                      name="title"
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      placeholder="e.g., Final Invoice - Backup Power Installation"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dueAt">Due Date</Label>
                    <Input
                      id="dueAt"
                      name="dueAt"
                      type="date"
                      value={formData.dueAt}
                      onChange={(e) => setFormData({ ...formData, dueAt: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Invoice description and notes"
                    rows={3}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Actual Costs</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="travelCost">Travel Cost ($)</Label>
                      <Input
                        id="travelCost"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.actualTravelCost}
                        onChange={(e) => setFormData({ ...formData, actualTravelCost: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="labourHours">Labour Hours</Label>
                      <Input
                        id="labourHours"
                        type="number"
                        min="0"
                        step="0.5"
                        value={formData.actualLabourHours}
                        onChange={(e) => setFormData({ ...formData, actualLabourHours: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="labourRate">Labour Rate ($/hr)</Label>
                      <Input
                        id="labourRate"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.actualLabourRate}
                        onChange={(e) => setFormData({ ...formData, actualLabourRate: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="partsCost">Parts Cost ($)</Label>
                      <Input
                        id="partsCost"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.actualPartsCost}
                        onChange={(e) => setFormData({ ...formData, actualPartsCost: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Invoice Items</h3>
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

                <div className="grid grid-cols-2 gap-4">
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
                </div>

                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Items Subtotal:</span>
                    <span>${formData.items.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Travel Cost:</span>
                    <span>${(formData.actualTravelCost || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Labour Cost:</span>
                    <span>${((formData.actualLabourHours || 0) * (formData.actualLabourRate || 0)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Parts Cost:</span>
                    <span>${(formData.actualPartsCost || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-2">
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
                  {formData.quoteId && (
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Deposit Paid:</span>
                      <span>${(quotes.find(q => q.id === formData.quoteId)?.depositPaid || 0).toFixed(2)}</span>
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
                        Creating Invoice...
                      </>
                    ) : (
                      "Create Invoice"
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
              placeholder="Search invoices..."
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
              <SelectItem value={InvoiceStatus.DRAFT}>Draft</SelectItem>
              <SelectItem value={InvoiceStatus.ISSUED}>Issued</SelectItem>
              <SelectItem value={InvoiceStatus.PARTIALLY_PAID}>Partially Paid</SelectItem>
              <SelectItem value={InvoiceStatus.PAID}>Paid</SelectItem>
              <SelectItem value={InvoiceStatus.OVERDUE}>Overdue</SelectItem>
              <SelectItem value={InvoiceStatus.CANCELLED}>Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Invoices ({filteredInvoices.length})
            </CardTitle>
            <CardDescription>
              Manage all your customer invoices
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredInvoices.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {invoices.length === 0 ? "No invoices yet" : "No invoices found"}
                </h3>
                <p className="text-gray-600 mb-4">
                  {invoices.length === 0 
                    ? "Create your first invoice to get started" 
                    : "Try adjusting your search or filter criteria"
                  }
                </p>
                {invoices.length === 0 && (
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Invoice
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Balance Due</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono text-sm">
                        {invoice.invoiceNumber}
                      </TableCell>
                      <TableCell className="font-medium">
                        {invoice.title}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{invoice.customer.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {invoice.customer.type}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(invoice.status)}>
                          {invoice.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        ${invoice.total.toFixed(2)}
                      </TableCell>
                      <TableCell className="font-medium">
                        ${invoice.balanceDue.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {invoice.dueAt ? (
                          format(new Date(invoice.dueAt), "MMM dd, yyyy")
                        ) : (
                          "No due date"
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="w-4 h-4" />
                          </Button>
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
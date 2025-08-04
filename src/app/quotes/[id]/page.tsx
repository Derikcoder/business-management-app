"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, FileText, CheckCircle, XCircle, CreditCard, Building, User, Calendar } from "lucide-react"
import { format } from "date-fns"
import { QuoteStatus, PaymentMethod, CustomerType } from "@prisma/client"

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
    name: string
    type: CustomerType
  }
  business: {
    name: string
    address: string | null
    phone: string | null
    email: string | null
  }
  items: {
    description: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }[]
}

export default function PublicQuotePage() {
  const params = useParams()
  const router = useRouter()
  const [quote, setQuote] = useState<Quote | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    method: PaymentMethod.BANK_TRANSFER,
    reference: "",
    notes: "",
  })

  useEffect(() => {
    fetchQuote()
  }, [params.id])

  const fetchQuote = async () => {
    try {
      const response = await fetch(`/api/quotes/public/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setQuote(data.quote)
        setPaymentForm({
          ...paymentForm,
          amount: data.quote.depositRequired - data.quote.depositPaid
        })
      } else {
        setError("Quote not found")
      }
    } catch (error) {
      setError("Error loading quote")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAcceptQuote = async () => {
    setIsProcessing(true)
    try {
      const response = await fetch(`/api/quotes/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: QuoteStatus.ACCEPTED }),
      })

      if (response.ok) {
        fetchQuote()
      } else {
        setError("Failed to accept quote")
      }
    } catch (error) {
      setError("Error accepting quote")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRejectQuote = async () => {
    setIsProcessing(true)
    try {
      const response = await fetch(`/api/quotes/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: QuoteStatus.REJECTED }),
      })

      if (response.ok) {
        fetchQuote()
      } else {
        setError("Failed to reject quote")
      }
    } catch (error) {
      setError("Error rejecting quote")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDepositPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)
    setError("")

    try {
      const response = await fetch(`/api/quotes/${params.id}/payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentForm),
      })

      if (response.ok) {
        setShowPaymentForm(false)
        fetchQuote()
      } else {
        const data = await response.json()
        setError(data.error || "Payment processing failed")
      }
    } catch (error) {
      setError("Error processing payment")
    } finally {
      setIsProcessing(false)
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

  const isQuoteExpired = () => {
    if (!quote?.validUntil) return false
    return new Date(quote.validUntil) < new Date()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <XCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Quote Not Found</h2>
            <p className="text-gray-600 mb-4">
              {error || "The quote you're looking for doesn't exist or may have been removed."}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const remainingDeposit = quote.depositRequired - quote.depositPaid

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Quote {quote.quoteNumber}
                </CardTitle>
                <CardDescription>
                  {quote.title}
                </CardDescription>
              </div>
              <Badge className={getStatusBadgeColor(quote.status)}>
                {quote.status.replace("_", " ")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Business and Customer Info */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  From
                </h3>
                <div className="space-y-1 text-sm">
                  <p className="font-medium">{quote.business.name}</p>
                  {quote.business.address && <p>{quote.business.address}</p>}
                  {quote.business.phone && <p>Phone: {quote.business.phone}</p>}
                  {quote.business.email && <p>Email: {quote.business.email}</p>}
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Customer
                </h3>
                <div className="space-y-1 text-sm">
                  <p className="font-medium">{quote.customer.name}</p>
                  <Badge variant="outline" className="text-xs">
                    {quote.customer.type}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* Quote Details */}
            <div>
              <h3 className="font-semibold mb-3">Quote Details</h3>
              {quote.description && (
                <p className="text-gray-600 mb-4">{quote.description}</p>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Quote Date:</span>
                  <p className="font-medium">
                    {format(new Date(quote.createdAt), "MMMM dd, yyyy")}
                  </p>
                </div>
                {quote.validUntil && (
                  <div>
                    <span className="text-gray-500">Valid Until:</span>
                    <p className="font-medium">
                      {format(new Date(quote.validUntil), "MMMM dd, yyyy")}
                    </p>
                  </div>
                )}
                {quote.acceptedAt && (
                  <div>
                    <span className="text-gray-500">Accepted On:</span>
                    <p className="font-medium">
                      {format(new Date(quote.acceptedAt), "MMMM dd, yyyy")}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Line Items */}
            <div>
              <h3 className="font-semibold mb-3">Items & Services</h3>
              <div className="space-y-2">
                {quote.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <div>
                      <span className="font-medium">{item.description}</span>
                      <span className="text-gray-500 ml-2">
                        × {item.quantity} @ ${item.unitPrice.toFixed(2)}
                      </span>
                    </div>
                    <span className="font-medium">${item.totalPrice.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Summary */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${quote.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax ({(quote.taxRate * 100).toFixed(1)}%):</span>
                <span>${quote.taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg border-t pt-2">
                <span>Total:</span>
                <span>${quote.total.toFixed(2)}</span>
              </div>
              {quote.depositRequired > 0 && (
                <>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Deposit Required:</span>
                    <span>${quote.depositRequired.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Deposit Paid:</span>
                    <span>${quote.depositPaid.toFixed(2)}</span>
                  </div>
                  {remainingDeposit > 0 && (
                    <div className="flex justify-between text-sm font-medium text-orange-600">
                      <span>Remaining Deposit:</span>
                      <span>${remainingDeposit.toFixed(2)}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Action Buttons */}
            {quote.status === QuoteStatus.SENT && !isQuoteExpired() && (
              <div className="space-y-4">
                <Alert>
                  <Calendar className="h-4 w-4" />
                  <AlertDescription>
                    This quote is valid until {format(new Date(quote.validUntil!), "MMMM dd, yyyy")}.
                    Please accept or reject this quote by then.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-4">
                  <Button
                    onClick={handleAcceptQuote}
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Accept Quote
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleRejectQuote}
                    disabled={isProcessing}
                    variant="outline"
                    className="flex-1"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject Quote
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Payment Section */}
            {quote.status === QuoteStatus.ACCEPTED && quote.depositRequired > 0 && remainingDeposit > 0 && (
              <div className="space-y-4">
                <Alert>
                  <CreditCard className="h-4 w-4" />
                  <AlertDescription>
                    A deposit of ${quote.depositRequired.toFixed(2)} is required to confirm this quote.
                    ${quote.depositPaid.toFixed(2)} has been paid. Remaining: ${remainingDeposit.toFixed(2)}
                  </AlertDescription>
                </Alert>

                {!showPaymentForm ? (
                  <Button
                    onClick={() => setShowPaymentForm(true)}
                    className="w-full"
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Make Deposit Payment
                  </Button>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Deposit Payment</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleDepositPayment} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="amount">Payment Amount ($)</Label>
                            <Input
                              id="amount"
                              type="number"
                              min="0.01"
                              step="0.01"
                              max={remainingDeposit}
                              value={paymentForm.amount}
                              onChange={(e) => setPaymentForm({
                                ...paymentForm,
                                amount: parseFloat(e.target.value) || 0
                              })}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="method">Payment Method</Label>
                            <Select
                              value={paymentForm.method}
                              onValueChange={(value) => setPaymentForm({
                                ...paymentForm,
                                method: value as PaymentMethod
                              })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={PaymentMethod.BANK_TRANSFER}>Bank Transfer</SelectItem>
                                <SelectItem value={PaymentMethod.CREDIT_CARD}>Credit Card</SelectItem>
                                <SelectItem value={PaymentMethod.CASH}>Cash</SelectItem>
                                <SelectItem value={PaymentMethod.MOBILE_MONEY}>Mobile Money</SelectItem>
                                <SelectItem value={PaymentMethod.CHEQUE}>Cheque</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="reference">Payment Reference</Label>
                          <Input
                            id="reference"
                            value={paymentForm.reference}
                            onChange={(e) => setPaymentForm({
                              ...paymentForm,
                              reference: e.target.value
                            })}
                            placeholder="Transaction ID, cheque number, etc."
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="notes">Notes</Label>
                          <Textarea
                            id="notes"
                            value={paymentForm.notes}
                            onChange={(e) => setPaymentForm({
                              ...paymentForm,
                              notes: e.target.value
                            })}
                            placeholder="Any additional payment information"
                            rows={3}
                          />
                        </div>

                        <div className="flex gap-4">
                          <Button
                            type="submit"
                            disabled={isProcessing}
                            className="flex-1"
                          >
                            {isProcessing ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing Payment...
                              </>
                            ) : (
                              "Submit Payment"
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowPaymentForm(false)}
                            disabled={isProcessing}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Status Messages */}
            {quote.status === QuoteStatus.ACCEPTED && remainingDeposit <= 0 && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Quote accepted and deposit paid in full. Thank you for your business!
                </AlertDescription>
              </Alert>
            )}

            {quote.status === QuoteStatus.REJECTED && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  This quote has been rejected.
                </AlertDescription>
              </Alert>
            )}

            {isQuoteExpired() && quote.status === QuoteStatus.SENT && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  This quote has expired on {format(new Date(quote.validUntil!), "MMMM dd, yyyy")}.
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { PaymentStatus, PaymentMethod } from "@prisma/client"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user.businessId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { amount, method, reference, notes } = await request.json()
    const quoteId = params.id

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid payment amount" },
        { status: 400 }
      )
    }

    if (!Object.values(PaymentMethod).includes(method)) {
      return NextResponse.json(
        { error: "Invalid payment method" },
        { status: 400 }
      )
    }

    const quote = await db.quote.findFirst({
      where: {
        id: quoteId,
        businessId: session.user.businessId,
        status: {
          in: ["ACCEPTED", "CONVERTED_TO_INVOICE"]
        }
      },
    })

    if (!quote) {
      return NextResponse.json(
        { error: "Quote not found or not eligible for payment" },
        { status: 404 }
      )
    }

    const remainingDeposit = quote.depositRequired - quote.depositPaid

    if (amount > remainingDeposit) {
      return NextResponse.json(
        { error: `Payment amount exceeds remaining deposit of $${remainingDeposit.toFixed(2)}` },
        { status: 400 }
      )
    }

    // Create payment record
    const payment = await db.payment.create({
      data: {
        amount,
        method,
        reference,
        notes,
        invoiceId: null, // Will be linked when invoice is created
        status: PaymentStatus.COMPLETED,
      },
    })

    // Update quote deposit paid amount
    const updatedQuote = await db.quote.update({
      where: { id: quoteId },
      data: {
        depositPaid: quote.depositPaid + amount,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        business: {
          select: {
            name: true,
            address: true,
            phone: true,
            email: true,
          },
        },
        items: true,
      },
    })

    return NextResponse.json({
      message: "Payment processed successfully",
      payment,
      quote: updatedQuote,
    })
  } catch (error) {
    console.error("Payment processing error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
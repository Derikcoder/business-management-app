import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { QuoteStatus } from "@prisma/client"

function generateQuoteNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `Q-${timestamp}-${random}`
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user.businessId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const quotes = await db.quote.findMany({
      where: {
        businessId: session.user.businessId,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({
      quotes,
    })
  } catch (error) {
    console.error("Error fetching quotes:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user.businessId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { 
      title, 
      description, 
      customerId, 
      items, 
      subtotal, 
      taxRate, 
      taxAmount, 
      total, 
      depositRequired,
      validUntil 
    } = await request.json()

    if (!title || !customerId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Title, customer, and at least one item are required" },
        { status: 400 }
      )
    }

    const customer = await db.customer.findFirst({
      where: {
        id: customerId,
        businessId: session.user.businessId,
      },
    })

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      )
    }

    const quoteNumber = generateQuoteNumber()

    const quote = await db.quote.create({
      data: {
        quoteNumber,
        title,
        description,
        customerId,
        businessId: session.user.businessId,
        createdById: session.user.id,
        subtotal,
        taxRate,
        taxAmount,
        total,
        depositRequired,
        validUntil: validUntil ? new Date(validUntil) : null,
        status: QuoteStatus.DRAFT,
        items: {
          create: items.map((item: any) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          })),
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: true,
      },
    })

    return NextResponse.json({
      message: "Quote created successfully",
      quote,
    })
  } catch (error) {
    console.error("Quote creation error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
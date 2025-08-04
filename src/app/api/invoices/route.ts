import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { InvoiceStatus, QuoteStatus } from "@prisma/client"

function generateInvoiceNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `INV-${timestamp}-${random}`
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user.businessId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const convertible = searchParams.get("convertible")

    let whereClause: any = {
      businessId: session.user.businessId,
    }

    if (convertible === "true") {
      whereClause = {
        ...whereClause,
        status: {
          in: [QuoteStatus.ACCEPTED]
        },
        invoice: null,
      }
    }

    if (convertible !== "true") {
      const invoices = await db.invoice.findMany({
        where: whereClause,
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
          quote: {
            select: {
              id: true,
              quoteNumber: true,
              title: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      })

      return NextResponse.json({
        invoices,
      })
    } else {
      const quotes = await db.quote.findMany({
        where: whereClause,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              type: true,
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
    }
  } catch (error) {
    console.error("Error fetching invoices:", error)
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
      quoteId,
      title, 
      description, 
      actualTravelCost,
      actualLabourHours,
      actualLabourRate,
      actualPartsCost,
      items, 
      subtotal, 
      taxRate, 
      taxAmount, 
      total, 
      depositPaid,
      dueAt 
    } = await request.json()

    if (!title || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Title and at least one item are required" },
        { status: 400 }
      )
    }

    let customerId = ""
    let businessId = session.user.businessId

    // If quote is provided, validate and get customer info
    if (quoteId) {
      const quote = await db.quote.findFirst({
        where: {
          id: quoteId,
          businessId: session.user.businessId,
          status: QuoteStatus.ACCEPTED,
        },
        include: {
          customer: true,
        },
      })

      if (!quote) {
        return NextResponse.json(
          { error: "Quote not found or not eligible for invoicing" },
          { status: 404 }
        )
      }

      if (quote.invoice) {
        return NextResponse.json(
          { error: "Invoice already exists for this quote" },
          { status: 400 }
        )
      }

      customerId = quote.customerId
      businessId = quote.businessId
    }

    const invoiceNumber = generateInvoiceNumber()

    const invoice = await db.invoice.create({
      data: {
        invoiceNumber,
        title,
        description,
        customerId,
        businessId,
        createdById: session.user.id,
        subtotal,
        taxRate,
        taxAmount,
        total,
        depositPaid: depositPaid || 0,
        balanceDue: total - (depositPaid || 0),
        actualTravelCost: actualTravelCost || 0,
        actualLabourHours: actualLabourHours || 0,
        actualLabourRate: actualLabourRate || 0,
        actualPartsCost: actualPartsCost || 0,
        dueAt: dueAt ? new Date(dueAt) : null,
        issuedAt: new Date(),
        status: InvoiceStatus.ISSUED,
        quoteId: quoteId || null,
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
        quote: {
          select: {
            id: true,
            quoteNumber: true,
            title: true,
          },
        },
        items: true,
      },
    })

    // If created from quote, update quote status
    if (quoteId) {
      await db.quote.update({
        where: { id: quoteId },
        data: {
          status: QuoteStatus.CONVERTED_TO_INVOICE,
        },
      })
    }

    return NextResponse.json({
      message: "Invoice created successfully",
      invoice,
    })
  } catch (error) {
    console.error("Invoice creation error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
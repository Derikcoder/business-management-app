import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { QuoteStatus } from "@prisma/client"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const quoteId = params.id

    const quote = await db.quote.findUnique({
      where: {
        id: quoteId,
        status: {
          in: [QuoteStatus.SENT, QuoteStatus.ACCEPTED, QuoteStatus.REJECTED]
        }
      },
      include: {
        customer: {
          select: {
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

    if (!quote) {
      return NextResponse.json(
        { error: "Quote not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      quote,
    })
  } catch (error) {
    console.error("Error fetching public quote:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
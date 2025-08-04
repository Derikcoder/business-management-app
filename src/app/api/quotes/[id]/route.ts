import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { QuoteStatus } from "@prisma/client"

export async function PATCH(
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

    const { status, depositPaid } = await request.json()
    const quoteId = params.id

    const quote = await db.quote.findFirst({
      where: {
        id: quoteId,
        businessId: session.user.businessId,
      },
    })

    if (!quote) {
      return NextResponse.json(
        { error: "Quote not found" },
        { status: 404 }
      )
    }

    const updateData: any = {}
    
    if (status) {
      updateData.status = status
      
      if (status === QuoteStatus.ACCEPTED) {
        updateData.acceptedAt = new Date()
      }
    }
    
    if (depositPaid !== undefined) {
      updateData.depositPaid = depositPaid
      
      // If deposit is paid and status is still SENT, update to ACCEPTED
      if (depositPaid > 0 && quote.status === QuoteStatus.SENT) {
        updateData.status = QuoteStatus.ACCEPTED
        updateData.acceptedAt = new Date()
      }
    }

    const updatedQuote = await db.quote.update({
      where: { id: quoteId },
      data: updateData,
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
      message: "Quote updated successfully",
      quote: updatedQuote,
    })
  } catch (error) {
    console.error("Quote update error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
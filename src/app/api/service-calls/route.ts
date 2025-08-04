import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ServiceCallStatus } from "@prisma/client"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user.businessId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const serviceCalls = await db.serviceCall.findMany({
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
        assignedTo: {
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
      serviceCalls,
    })
  } catch (error) {
    console.error("Error fetching service calls:", error)
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

    const { title, description, customerId, assignedToId, scheduledAt, address, notes } = await request.json()

    if (!title || !customerId) {
      return NextResponse.json(
        { error: "Title and customer are required" },
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

    if (assignedToId) {
      const assignee = await db.user.findFirst({
        where: {
          id: assignedToId,
          businessId: session.user.businessId,
        },
      })

      if (!assignee) {
        return NextResponse.json(
          { error: "Assigned team member not found" },
          { status: 404 }
        )
      }
    }

    const serviceCall = await db.serviceCall.create({
      data: {
        title,
        description,
        customerId,
        assignedToId,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        address: address || customer.address,
        notes,
        businessId: session.user.businessId,
        status: ServiceCallStatus.PENDING,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({
      message: "Service call created successfully",
      serviceCall,
    })
  } catch (error) {
    console.error("Service call creation error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
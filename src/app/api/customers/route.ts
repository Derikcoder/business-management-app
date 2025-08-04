import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { CustomerType } from "@prisma/client"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user.businessId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const customers = await db.customer.findMany({
      where: {
        businessId: session.user.businessId,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({
      customers,
    })
  } catch (error) {
    console.error("Error fetching customers:", error)
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

    const { name, email, phone, address, type } = await request.json()

    if (!name || !type) {
      return NextResponse.json(
        { error: "Name and customer type are required" },
        { status: 400 }
      )
    }

    if (!Object.values(CustomerType).includes(type)) {
      return NextResponse.json(
        { error: "Invalid customer type" },
        { status: 400 }
      )
    }

    const customer = await db.customer.create({
      data: {
        name,
        email,
        phone,
        address,
        type,
        businessId: session.user.businessId,
      },
    })

    return NextResponse.json({
      message: "Customer created successfully",
      customer,
    })
  } catch (error) {
    console.error("Customer creation error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
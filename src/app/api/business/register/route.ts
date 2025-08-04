import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { name, address, phone, email, description } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: "Business name is required" },
        { status: 400 }
      )
    }

    const existingBusiness = await db.business.findFirst({
      where: {
        ownerId: session.user.id
      }
    })

    if (existingBusiness) {
      return NextResponse.json(
        { error: "You already have a registered business" },
        { status: 400 }
      )
    }

    const business = await db.business.create({
      data: {
        name,
        address,
        phone,
        email,
        description,
        ownerId: session.user.id
      }
    })

    await db.user.update({
      where: {
        id: session.user.id
      },
      data: {
        businessId: business.id
      }
    })

    return NextResponse.json({
      message: "Business registered successfully",
      business: {
        id: business.id,
        name: business.name,
        address: business.address,
        phone: business.phone,
        email: business.email,
        description: business.description
      }
    })
  } catch (error) {
    console.error("Business registration error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// GET - Haal besigheids instellings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    if (!session.user.businessId) {
      return NextResponse.json(
        { error: "No business associated with this user" },
        { status: 400 }
      )
    }

    const business = await db.business.findUnique({
      where: {
        id: session.user.businessId
      }
    })

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
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
    console.error("Business settings fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PUT - Werk besigheids instellings by
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    if (!session.user.businessId) {
      return NextResponse.json(
        { error: "No business associated with this user" },
        { status: 400 }
      )
    }

    const { name, address, phone, email, description } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: "Business name is required" },
        { status: 400 }
      )
    }

    const updatedBusiness = await db.business.update({
      where: {
        id: session.user.businessId
      },
      data: {
        name,
        address,
        phone,
        email,
        description
      }
    })

    return NextResponse.json({
      message: "Business settings updated successfully",
      business: {
        id: updatedBusiness.id,
        name: updatedBusiness.name,
        address: updatedBusiness.address,
        phone: updatedBusiness.phone,
        email: updatedBusiness.email,
        description: updatedBusiness.description
      }
    })
  } catch (error) {
    console.error("Business settings update error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

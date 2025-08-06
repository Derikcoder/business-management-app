import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { UserRole } from "@prisma/client"

export async function POST(request: NextRequest) {
  try {
    console.log("Registration attempt started")
    
    const body = await request.json()
    console.log("Request body received:", { ...body, password: '[REDACTED]' })
    
    const { name, email, password } = body

    if (!name || !email || !password) {
      console.log("Missing required fields:", { name: !!name, email: !!email, password: !!password })
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      console.log("Password too short")
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      )
    }

    console.log("Checking for existing user with email:", email)

    const existingUser = await db.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      console.log("User already exists with email:", email)
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      )
    }

    console.log("Hashing password...")
    const hashedPassword = await bcrypt.hash(password, 12)

    console.log("Creating user in database...")
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: UserRole.SUPER_ADMIN
      }
    })

    console.log("User created successfully:", user.id)
    return NextResponse.json({
      message: "User created successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })
  } catch (error) {
    console.error("Registration error:", error)
    console.error("Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      name: error instanceof Error ? error.name : 'Unknown'
    })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
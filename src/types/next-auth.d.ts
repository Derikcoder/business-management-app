import { UserRole } from "@prisma/client"
import "next-auth"

declare module "next-auth" {
  interface User {
    role: UserRole
    businessId?: string
    businessName?: string
  }

  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: UserRole
      businessId?: string
      businessName?: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole
    businessId?: string
    businessName?: string
  }
}
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RegisterUserArgs {
  oidcId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  picture?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegisterUserArgs;

    // Validate required fields
    if (!body.oidcId) {
      return NextResponse.json(
        { error: "oidcId is required" },
        { status: 400 }
      );
    }

    // Upsert user in database
    const user = await prisma.user.upsert({
      where: { oidcId: body.oidcId },
      update: {
        email: body.email,
        firstName: body.firstName,
        lastName: body.lastName,
        picture: body.picture,
      },
      create: {
        oidcId: body.oidcId,
        email: body.email,
        firstName: body.firstName,
        lastName: body.lastName,
        picture: body.picture,
      },
    });

    console.log("User registered/updated:", {
      oidcId: user.oidcId,
      email: user.email,
      firstName: user.firstName,
    });

    return NextResponse.json({
      success: true,
      message: "User registered successfully",
      user: {
        oidcId: user.oidcId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to register user" },
      { status: 500 }
    );
  }
}

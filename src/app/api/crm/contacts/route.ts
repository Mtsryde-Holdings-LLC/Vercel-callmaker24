import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      return NextResponse.json([]); // Return empty array if no organization
    }

    // Check if requesting a single contact
    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get("id");

    if (contactId) {
      // Fetch single contact
      const contact = await prisma.customer.findFirst({
        where: {
          id: contactId,
          organizationId: user.organizationId,
        },
        include: {
          orders: {
            orderBy: { orderDate: "desc" },
            take: 20,
          },
        },
      });

      if (!contact) {
        return NextResponse.json(
          { error: "Contact not found" },
          { status: 404 }
        );
      }

      console.log("Fetched contact:", {
        id: contact.id,
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        phone: contact.phone,
        notes: contact.notes,
        address: contact.address,
        ordersCount: contact.orders?.length || 0,
        totalSpent: contact.totalSpent,
        orderCount: contact.orderCount,
      });

      return NextResponse.json({
        id: contact.id,
        name:
          `${contact.firstName || ""} ${contact.lastName || ""}`.trim() ||
          "Unknown",
        email: contact.email || "",
        phone: contact.phone || "",
        company: contact.company || "",
        status: "active",
        lastContact: contact.updatedAt.toISOString(),
        dealValue: contact.totalSpent || 0,
        notes: contact.notes || "",
        address: contact.address || "",
        website: contact.company || "",
        createdAt: contact.createdAt.toISOString(),
        updatedAt: contact.updatedAt.toISOString(),
        orders: contact.orders || [],
      });
    }

    // Fetch all contacts
    const contacts = await prisma.customer.findMany({
      where: {
        organizationId: user.organizationId,
        status: "ACTIVE",
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        company: true,
        updatedAt: true,
        customFields: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    // Transform to match frontend format
    const transformedContacts = contacts.map((contact) => ({
      id: contact.id,
      name:
        `${contact.firstName || ""} ${contact.lastName || ""}`.trim() || "N/A",
      email: contact.email || "",
      phone: contact.phone || "",
      company: contact.company || "",
      status: "active",
      lastContact: contact.updatedAt.toISOString(),
      dealValue: 0, // Can be extended with deals table later
    }));

    return NextResponse.json(transformedContacts);
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json(
      { error: "Failed to fetch contacts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 400 }
      );
    }

    // Create contact in database
    const newContact = await prisma.customer.create({
      data: {
        firstName: body.name?.split(" ")[0] || "",
        lastName: body.name?.split(" ").slice(1).join(" ") || "",
        email: body.email,
        phone: body.phone,
        company: body.company,
        status: "ACTIVE",
        organizationId: user.organizationId,
        createdById: session.user.id,
      },
    });

    return NextResponse.json(
      {
        id: newContact.id,
        name: `${newContact.firstName} ${newContact.lastName}`.trim(),
        email: newContact.email,
        phone: newContact.phone,
        company: newContact.company,
        status: "active",
        lastContact: newContact.createdAt.toISOString(),
        dealValue: 0,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating contact:", error);
    return NextResponse.json(
      { error: "Failed to create contact" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, email, phone, company, notes, address, website } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Contact ID required" },
        { status: 400 }
      );
    }

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 400 }
      );
    }

    // Update contact
    const updatedContact = await prisma.customer.update({
      where: {
        id,
        organizationId: user.organizationId,
      },
      data: {
        firstName: name?.split(" ")[0] || undefined,
        lastName: name?.split(" ").slice(1).join(" ") || undefined,
        email: email || undefined,
        phone: phone || undefined,
        company: company || undefined,
        notes: notes || undefined,
        address: address || undefined,
      },
    });

    return NextResponse.json({
      id: updatedContact.id,
      name: `${updatedContact.firstName || ""} ${
        updatedContact.lastName || ""
      }`.trim(),
      email: updatedContact.email || "",
      phone: updatedContact.phone || "",
      company: updatedContact.company || "",
      status: "active",
      lastContact: updatedContact.updatedAt.toISOString(),
      dealValue: updatedContact.totalSpent || 0,
      notes: updatedContact.notes || "",
      address: updatedContact.address || "",
      website: website || "",
      createdAt: updatedContact.createdAt.toISOString(),
      updatedAt: updatedContact.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("Error updating contact:", error);
    return NextResponse.json(
      { error: "Failed to update contact" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get("id");

    if (!contactId) {
      return NextResponse.json(
        { error: "Contact ID required" },
        { status: 400 }
      );
    }

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 400 }
      );
    }

    // Soft delete by setting status to INACTIVE
    await prisma.customer.update({
      where: {
        id: contactId,
        organizationId: user.organizationId,
      },
      data: {
        status: "INACTIVE",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting contact:", error);
    return NextResponse.json(
      { error: "Failed to delete contact" },
      { status: 500 }
    );
  }
}

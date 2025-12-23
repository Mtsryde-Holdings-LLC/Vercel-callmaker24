import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ivrParamsSchema = z.object({
  orgId: z.string().min(1, "Organization ID required"),
  from: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number")
    .optional(),
  callSid: z.string().startsWith("CA", "Invalid Twilio Call SID").optional(),
});

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Validate query parameters
    const validation = ivrParamsSchema.safeParse({
      orgId: searchParams.get("orgId"),
      from: searchParams.get("from"),
      callSid: searchParams.get("callSid"),
    });

    if (!validation.success) {
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Invalid request parameters.</Say>
  <Hangup/>
</Response>`,
        {
          headers: { "Content-Type": "text/xml" },
          status: 400,
        }
      );
    }

    const { orgId, from: From, callSid: CallSid } = validation.data;

    const formData = await req.formData();
    const Digits = formData.get("Digits") as string;

    const departments: Record<string, string> = {
      "1": "Sales",
      "2": "Technical Support",
      "3": "Billing",
      "4": "General Inquiries",
    };

    if (Digits === "0") {
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Connecting you to an operator.</Say>
  <Dial>
    <Queue>operator-${orgId}</Queue>
  </Dial>
</Response>`,
        { headers: { "Content-Type": "text/xml" } }
      );
    }

    const dept = departments[Digits];
    if (dept) {
      await prisma.call.create({
        data: {
          from: From || "",
          to: "",
          direction: "INBOUND",
          status: "IN_PROGRESS",
          twilioCallSid: CallSid,
          ivrPath: [dept],
          organizationId: orgId,
          startedAt: new Date(),
        },
      });

      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>You selected ${dept}. Please hold while we connect you.</Say>
  <Enqueue waitUrl="/api/ivr/hold-music">${dept
    .toLowerCase()
    .replace(" ", "-")}-${orgId}</Enqueue>
</Response>`,
        { headers: { "Content-Type": "text/xml" } }
      );
    }

    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Invalid selection.</Say>
  <Redirect>/api/ivr/menu?orgId=${orgId}&from=${From || ""}&callSid=${
        CallSid || ""
      }</Redirect>
</Response>`,
      { headers: { "Content-Type": "text/xml" } }
    );
  } catch (error) {
    console.error("IVR menu error:", error);
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>An error occurred. Please try again later.</Say>
  <Hangup/>
</Response>`,
      {
        headers: { "Content-Type": "text/xml" },
        status: 500,
      }
    );
  }
}

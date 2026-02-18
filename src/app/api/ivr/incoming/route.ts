import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withWebhookHandler, ApiContext } from "@/lib/api-handler";

export const POST = withWebhookHandler(
  async (req: NextRequest, { requestId }: ApiContext) => {
    const formData = await req.formData();
    const From = formData.get("From") as string;
    const CallSid = formData.get("CallSid") as string;

    // Try to find tenant by caller ID
    const customer = await prisma.customer.findFirst({
      where: { phone: From },
      include: { organization: true },
    });

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${
    customer?.organization?.companyCode
      ? `
  <Gather input="dtmf" numDigits="1" action="/api/ivr/tenant/confirm?orgId=${customer.organizationId}&from=${From}&callSid=${CallSid}">
    <Say>We found your account with ${customer.organization.name}. Press 1 to continue, or press 2 to enter a different company code.</Say>
  </Gather>
  `
      : `
  <Gather input="dtmf" numDigits="4" finishOnKey="#" action="/api/ivr/tenant/validate?from=${From}&callSid=${CallSid}">
    <Say>Thank you for calling. Please enter your 4-digit company code followed by the pound key.</Say>
  </Gather>
  <Say>We did not receive your company code. Please try again.</Say>
  <Redirect>/api/ivr/incoming</Redirect>
  `
  }
</Response>`;

    return new NextResponse(twiml, {
      headers: { "Content-Type": "text/xml" },
    });
  },
  { route: "POST /api/ivr/incoming" },
);

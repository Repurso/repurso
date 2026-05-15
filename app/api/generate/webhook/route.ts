import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function verifyLemonSqueezySignature(rawBody: string, signature: string | null) {
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;

  if (!secret) {
    throw new Error("Missing LEMON_SQUEEZY_WEBHOOK_SECRET");
  }

  if (!signature) {
    return false;
  }

  const hmac = crypto.createHmac("sha256", secret);
  const digest = hmac.update(rawBody).digest("hex");

  const digestBuffer = Buffer.from(digest, "hex");
  const signatureBuffer = Buffer.from(signature, "hex");

  if (digestBuffer.length !== signatureBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(digestBuffer, signatureBuffer);
}

function getPlanFromProductName(productName?: string | null) {
  const name = productName?.toLowerCase() ?? "";

  if (name.includes("pro")) return "pro";
  if (name.includes("creator")) return "creator";

  return "free";
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("X-Signature");

    const isValid = verifyLemonSqueezySignature(rawBody, signature);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 }
      );
    }

    const payload = JSON.parse(rawBody);

    const eventName = payload?.meta?.event_name;
    const customData = payload?.meta?.custom_data;
    const attributes = payload?.data?.attributes;

    const userEmail =
      customData?.user_email ||
      attributes?.user_email ||
      attributes?.email ||
      attributes?.customer_email;

    const productName =
      attributes?.product_name ||
      attributes?.first_order_item?.product_name ||
      attributes?.variant_name;

    const plan = getPlanFromProductName(productName);

    if (!userEmail) {
      return NextResponse.json(
        { error: "User email not found in webhook payload" },
        { status: 400 }
      );
    }

    if (
      eventName === "order_created" ||
      eventName === "subscription_created" ||
      eventName === "subscription_updated" ||
      eventName === "subscription_resumed"
    ) {
      const { error } = await supabaseAdmin.from("profiles").upsert(
        {
          user_email: userEmail,
          plan,
        },
        {
          onConflict: "user_email",
        }
      );

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    if (
      eventName === "subscription_cancelled" ||
      eventName === "subscription_expired"
    ) {
      const { error } = await supabaseAdmin
        .from("profiles")
        .update({
          plan: "free",
        })
        .eq("user_email", userEmail);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook error";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
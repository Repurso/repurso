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
    console.error("WEBHOOK ERROR: Missing X-Signature header");
    return false;
  }

  const hmac = crypto.createHmac("sha256", secret);
  const digest = hmac.update(rawBody).digest("hex");

  const digestBuffer = Buffer.from(digest, "hex");
  const signatureBuffer = Buffer.from(signature, "hex");

  if (digestBuffer.length !== signatureBuffer.length) {
    console.error("WEBHOOK ERROR: Signature length mismatch");
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
    console.log("WEBHOOK STARTED");

    const rawBody = await request.text();
    const signature = request.headers.get("X-Signature");

    console.log("WEBHOOK SIGNATURE EXISTS:", Boolean(signature));

    const isValid = verifyLemonSqueezySignature(rawBody, signature);

    console.log("WEBHOOK SIGNATURE VALID:", isValid);

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

    console.log("WEBHOOK EVENT:", eventName);
    console.log("WEBHOOK CUSTOM DATA:", customData);
    console.log("WEBHOOK ATTRIBUTES EMAILS:", {
      user_email: attributes?.user_email,
      email: attributes?.email,
      customer_email: attributes?.customer_email,
    });
    console.log("WEBHOOK PRODUCT:", {
      product_name: attributes?.product_name,
      variant_name: attributes?.variant_name,
      first_order_item_product_name: attributes?.first_order_item?.product_name,
    });

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

    console.log("WEBHOOK RESOLVED:", {
      userEmail,
      productName,
      plan,
    });

    if (!userEmail) {
      console.error("WEBHOOK ERROR: User email not found");
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
      console.log("WEBHOOK UPSERT START");

      const { data, error } = await supabaseAdmin
        .from("profiles")
        .upsert(
          {
            user_email: userEmail,
            plan,
          },
          {
            onConflict: "user_email",
          }
        )
        .select();

      console.log("WEBHOOK UPSERT DATA:", data);

      if (error) {
        console.error("WEBHOOK SUPABASE UPSERT ERROR:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    if (
      eventName === "subscription_cancelled" ||
      eventName === "subscription_expired"
    ) {
      console.log("WEBHOOK DOWNGRADE START");

      const { data, error } = await supabaseAdmin
        .from("profiles")
        .update({
          plan: "free",
        })
        .eq("user_email", userEmail)
        .select();

      console.log("WEBHOOK DOWNGRADE DATA:", data);

      if (error) {
        console.error("WEBHOOK SUPABASE DOWNGRADE ERROR:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    console.log("WEBHOOK FINISHED");

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("WEBHOOK FATAL ERROR:", error);

    const message = error instanceof Error ? error.message : "Webhook error";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
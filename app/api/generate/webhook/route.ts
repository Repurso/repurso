import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const eventName = body.meta?.event_name;
    const customerEmail = body.data?.attributes?.user_email;
    const productName = body.data?.attributes?.product_name;

    if (eventName !== "subscription_created") {
      return NextResponse.json({ received: true });
    }

    if (!customerEmail || !productName) {
      return NextResponse.json(
        { error: "Missing customer email or product name" },
        { status: 400 }
      );
    }

    let plan = "free";

    if (productName.toLowerCase().includes("creator")) {
      plan = "creator";
    }

    if (productName.toLowerCase().includes("pro")) {
      plan = "pro";
    }

    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_email", customerEmail)
      .single();

    if (existingProfile) {
      await supabase
        .from("profiles")
        .update({ plan })
        .eq("user_email", customerEmail);
    } else {
      await supabase.from("profiles").insert({
        user_email: customerEmail,
        plan,
      });
    }

    return NextResponse.json({
      success: true,
      email: customerEmail,
      plan,
    });
  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      { error: error.message || "Webhook error" },
      { status: 500 }
    );
  }
}
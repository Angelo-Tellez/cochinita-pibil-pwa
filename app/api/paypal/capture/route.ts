import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const { orderID } = await req.json()

  const auth = Buffer.from(
    `${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString("base64")

  const tokenRes = await fetch("https://api-m.sandbox.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  })
  const { access_token } = await tokenRes.json()

  const captureRes = await fetch(
    `https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderID}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
    }
  )
  const order = await captureRes.json()
  return NextResponse.json(order)
}
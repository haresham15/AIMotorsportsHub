import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { webhookUrl, series, eventType, message, data } = body;

    const isValidWebhook = typeof webhookUrl === 'string' &&
      /^https:\/\/(?:ptb\.|canary\.)?discord(?:app)?\.com\/api\/webhooks\//i.test(webhookUrl)

    if (!isValidWebhook) {
      return NextResponse.json({ error: "Invalid or missing webhookUrl" }, { status: 400 });
    }

    // Determine embed color based on series or eventType
    let color = 0x3b82f6; // Default Blue
    if (series === 'f1') color = 0xff2800; // F1 Red
    if (eventType === 'SAFETY_CAR') color = 0xfbbf24; // Yellow

    const rawFields = data && typeof data === 'object' ? Object.entries(data) : []
    const fields = rawFields
      .slice(0, 25)
      .map(([key, value]) => ({
        name: (key || 'Detail').slice(0, 256),
        value: String(value ?? '--').slice(0, 1024) || '--',
        inline: true
      }))

    const embed = {
      title: `[ALERT] ${series ? series.toUpperCase() : 'Motorsport'}: ${eventType}`.slice(0, 256),
      description: String(message || '').slice(0, 4096),
      color,
      timestamp: new Date().toISOString(),
      footer: {
        text: 'Apexis - Live Updates'
      },
      fields
    };

    const payload = {
      username: "Race Control",
      avatar_url: "https://apexis-racing.vercel.app/icon", // Ensure this URL exists or use a generic one
      embeds: [embed]
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Discord API responded with ${response.status}`);
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Error sending Discord webhook:", e);
    return NextResponse.json({ error: "Failed to send webhook" }, { status: 500 });
  }
}

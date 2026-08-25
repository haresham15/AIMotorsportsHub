import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { webhookUrl, series, eventType, message, data } = body;

    if (!webhookUrl || !webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
      return NextResponse.json({ error: "Invalid or missing webhookUrl" }, { status: 400 });
    }

    // Determine embed color based on series or eventType
    let color = 0x3b82f6; // Default Blue
    if (series === 'f1') color = 0xff2800; // F1 Red
    if (eventType === 'SAFETY_CAR') color = 0xfbbf24; // Yellow

    const embed = {
      title: `🚨 ${series ? series.toUpperCase() : 'Motorsport'} Alert: ${eventType}`,
      description: message,
      color,
      timestamp: new Date().toISOString(),
      footer: {
        text: 'Apexis - Live Updates'
      },
      fields: data ? Object.entries(data).map(([key, value]) => ({
        name: key,
        value: String(value),
        inline: true
      })) : []
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

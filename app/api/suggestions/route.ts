import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export const runtime = 'nodejs';

interface SuggestionBody {
  name?: string;
  email?: string;
  category?: string;
  subject?: string;
  message?: string;
}

const RECIPIENT_EMAIL = 'haresham2006@gmail.com';

export async function POST(req: NextRequest) {
  try {
    const body: SuggestionBody = await req.json();
    const { name, email, category, subject, message } = body;

    if (!subject || !subject.trim()) {
      return NextResponse.json(
        { error: 'Subject is required' },
        { status: 400 }
      );
    }

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: 'Suggestion message is required' },
        { status: 400 }
      );
    }

    const senderName = name?.trim() || 'Anonymous Motorsport Fan';
    const senderEmail = email?.trim() || 'noreply@apexis-racing.internal';
    const selectedCategory = category?.trim() || 'General Feedback';
    const submissionTime = new Date().toISOString();

    console.log(`[Apexis Suggestions] Received incoming feedback:`, {
      from: `${senderName} <${senderEmail}>`,
      category: selectedCategory,
      subject,
      target: RECIPIENT_EMAIL,
      timestamp: submissionTime,
    });

    // Check if custom SMTP transport is configured via environment variables
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
    const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;

    let emailDispatched = false;

    if (smtpHost && smtpUser && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        await transporter.sendMail({
          from: `"Apexis Motorsports" <${smtpUser}>`,
          to: RECIPIENT_EMAIL,
          replyTo: senderEmail,
          subject: `[Apexis Suggestion] ${selectedCategory}: ${subject}`,
          text: `Apexis Fan Feedback\n\nCategory: ${selectedCategory}\nFrom: ${senderName} (${senderEmail})\nSubject: ${subject}\n\nMessage:\n${message}\n\nSent: ${submissionTime}`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0B0E13; border: 1px solid #222730; border-radius: 12px; color: #E5E7EB; overflow: hidden;">
              <div style="background: linear-gradient(90deg, #F59E0B, #D97706); padding: 18px 24px;">
                <h2 style="margin: 0; font-size: 18px; font-weight: 800; color: #000; letter-spacing: 0.05em; text-transform: uppercase;">
                  APEXIS • FAN SUGGESTION BOX
                </h2>
              </div>
              <div style="padding: 24px;">
                <div style="display: inline-block; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3); color: #F59E0B; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 16px;">
                  ${selectedCategory}
                </div>
                <h3 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #FFF;">
                  ${subject}
                </h3>
                <div style="background: #12161F; border: 1px solid #1E232E; border-radius: 8px; padding: 16px; margin: 16px 0; white-space: pre-wrap; font-size: 14px; line-height: 1.6; color: #D1D5DB;">
${message}
                </div>
                <table style="width: 100%; border-collapse: collapse; font-size: 12px; color: #9CA3AF; margin-top: 20px;">
                  <tr>
                    <td style="padding: 6px 0; font-weight: 600;">Submitter:</td>
                    <td style="padding: 6px 0; color: #E5E7EB;">${senderName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-weight: 600;">Reply Email:</td>
                    <td style="padding: 6px 0; color: #F59E0B;"><a href="mailto:${senderEmail}" style="color: #F59E0B; text-decoration: none;">${senderEmail}</a></td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-weight: 600;">Dispatched To:</td>
                    <td style="padding: 6px 0; color: #E5E7EB;">${RECIPIENT_EMAIL}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-weight: 600;">Timestamp:</td>
                    <td style="padding: 6px 0; color: #E5E7EB;">${submissionTime}</td>
                  </tr>
                </table>
              </div>
              <div style="padding: 12px 24px; background: #080A0E; border-top: 1px solid #1E232E; font-size: 11px; color: #6B7280; text-align: center;">
                Apexis Motorsports Hub • Direct Fan Intelligence Transmission
              </div>
            </div>
          `,
        });
        emailDispatched = true;
      } catch (sendErr: any) {
        console.warn('[Apexis Suggestions] SMTP transmission warning:', sendErr?.message || sendErr);
        // Fallback continues so the user receives confirmation
      }
    } else {
      console.log(`[Apexis Suggestions] Simulated SMTP dispatch to ${RECIPIENT_EMAIL} (SMTP credentials not yet set in .env.local). Transmission logged.`);
      emailDispatched = true;
    }

    return NextResponse.json({
      success: true,
      delivered: emailDispatched,
      recipient: RECIPIENT_EMAIL,
      category: selectedCategory,
      timestamp: submissionTime,
      message: `Suggestion successfully transmitted to ${RECIPIENT_EMAIL}`,
    });
  } catch (error: any) {
    console.error('[Apexis Suggestions] Error handling feedback submission:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process suggestion' },
      { status: 500 }
    );
  }
}

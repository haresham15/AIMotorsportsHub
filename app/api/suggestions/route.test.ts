import { describe, expect, it } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';

describe('POST /api/suggestions', () => {
  it('returns 400 when subject is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/suggestions', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Alex Turner',
        email: 'alex@example.com',
        category: 'Feature Request',
        subject: '',
        message: 'Add more telemetry gauges',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Subject is required');
  });

  it('returns 400 when message is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/suggestions', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Alex Turner',
        email: 'alex@example.com',
        category: 'Bug Report',
        subject: 'Telemetry lag',
        message: '   ',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Suggestion message is required');
  });

  it('successfully processes valid suggestions to haresham2006@gmail.com', async () => {
    const req = new NextRequest('http://localhost:3000/api/suggestions', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Fan',
        email: 'fan@example.com',
        category: 'Feature Request',
        subject: 'Top Fuel telemetry replay',
        message: 'Please add 60ft and 330ft trap speed indicators to drag racing replays.',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.recipient).toBe('haresham2006@gmail.com');
    expect(data.category).toBe('Feature Request');
    expect(data.delivered).toBe(true);
  });

  it('successfully processes malicious HTML suggestions without crashing', async () => {
    const req = new NextRequest('http://localhost:3000/api/suggestions', {
      method: 'POST',
      body: JSON.stringify({
        name: '<script>alert("name")</script>',
        email: 'attacker@example.com',
        category: 'Bug Report',
        subject: 'XSS Test <img src=x onerror=alert(1)>',
        message: '<h1>This is a test</h1><script>alert("xss")</script>',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.recipient).toBe('haresham2006@gmail.com');
    // Categories get escaped on response
    expect(data.category).toBe('Bug Report');
    expect(data.delivered).toBe(true);
  });
});

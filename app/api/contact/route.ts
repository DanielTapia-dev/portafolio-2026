import {NextRequest, NextResponse} from 'next/server';
import {Resend} from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const {name, email, message} = await req.json();
    console.log('HAS_RESEND_KEY:', Boolean(process.env.RESEND_API_KEY));
    if (!name || !email || !message) {
      return NextResponse.json(
        {ok: false, error: 'Missing fields'},
        {status: 400}
      );
    }

    const to = process.env.CONTACT_TO_EMAIL;
    const from = process.env.CONTACT_FROM_EMAIL;

    if (!process.env.RESEND_API_KEY || !to || !from) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Missing email env vars (RESEND_API_KEY / CONTACT_TO_EMAIL / CONTACT_FROM_EMAIL)'
        },
        {status: 500}
      );
    }

    const {data, error} = await resend.emails.send({
      from,
      to,
      replyTo: email,
      subject: `Portfolio contact — ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`
    });

    if (error) {
      console.error('RESEND_ERROR:', error);
      return NextResponse.json(
        {
          ok: false,
          error:
            process.env.NODE_ENV === 'development'
              ? ((error as any).message ?? String(error))
              : 'Email provider error'
        },
        {status: 502}
      );
    }

    return NextResponse.json({ok: true, id: data?.id}, {status: 200});
  } catch (err) {
    console.error('CONTACT_ROUTE_ERROR:', err);
    return NextResponse.json(
      {ok: false, error: 'Invalid request'},
      {status: 400}
    );
  }
}

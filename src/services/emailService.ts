import { Resend } from 'resend';
import { env } from '../config/env';

const resend = new Resend(env.resendApiKey);

interface StaleApplication {
  company: string;
  position: string;
  daysSinceChange: number;
}

// Un email de recordatorio por usuario, listando todas sus candidaturas
// estancadas, en vez de un email por candidatura - evita saturar la bandeja
// de entrada si tienes varias paradas a la vez.
export async function sendReminderEmail(to: string, applications: StaleApplication[]) {
  const listHtml = applications
    .map((a) => `<li>${a.position} en ${a.company} - sin cambios desde hace ${a.daysSinceChange} dias</li>`)
    .join('');

  await resend.emails.send({
    from: 'Job Assistant <onboarding@resend.dev>',
    to,
    subject: `Tienes ${applications.length} candidatura(s) sin actualizar`,
    html: `
      <p>Estas candidaturas llevan un tiempo sin movimiento:</p>
      <ul>${listHtml}</ul>
      <p>Puede ser buen momento para hacer seguimiento.</p>
    `,
  });
}
/**
 * Third-party email for guardian no-show notices.
 * Set RESEND_API_KEY and MEAL_DISTRIBUTION_EMAIL_FROM in env to enable sends.
 */
export class NotificationService {
  constructor(options = {}) {
    this.resendApiKey =
      options.resendApiKey ?? process.env.RESEND_API_KEY ?? '';
    this.from =
      options.from ??
      process.env.MEAL_DISTRIBUTION_EMAIL_FROM ??
      'KidsFeed <onboarding@resend.dev>';
  }

  async sendGuardianNoShowEmail({
    to,
    studentDisplayName,
    mealType,
    sessionDate,
    schoolLabel,
  }) {
    if (!this.resendApiKey) {
      return { ok: false, code: 'NO_EMAIL_PROVIDER' };
    }

    const subject = `Meal attendance notice — ${mealType}`;
    const text = `Hello,

This is to inform you that ${studentDisplayName} was not marked present for ${mealType} on ${sessionDate} (school: ${schoolLabel}).

If you have questions, please contact the school.

— KidsFeed
`;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.from,
        to: [to],
        subject,
        text,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        ok: false,
        code: 'PROVIDER_ERROR',
        message:
          typeof data.message === 'string'
            ? data.message
            : JSON.stringify(data) || response.statusText,
      };
    }

    return { ok: true, messageId: data.id };
  }
}

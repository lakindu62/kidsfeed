import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

let client = null;

const getClient = () => {
  if (!client) {
    if (!accountSid || !authToken) {
      throw new Error(
        'Twilio credentials are not configured (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN)'
      );
    }
    client = twilio(accountSid, authToken);
  }
  return client;
};

/**
 * Send an SMS to a guardian.
 * Silently skips if Twilio is not configured or phone is missing.
 * Never throws — SMS failure should not break the main operation.
 */
const sendGuardianSms = async (to, message) => {
  if (!accountSid || !authToken || !fromNumber) {
    console.warn('[Twilio] Message skipped — credentials not configured');
    return null;
  }
  if (!to) {
    console.warn('[Twilio] Message skipped — no phone number provided');
    return null;
  }

  // Use WhatsApp channel (Twilio sandbox: from must be whatsapp:+14155238886)
  const whatsappTo = `whatsapp:${to}`;
  const whatsappFrom = `whatsapp:${fromNumber}`;

  try {
    const msg = await getClient().messages.create({
      body: message,
      from: whatsappFrom,
      to: whatsappTo,
    });
    console.info(
      `[Twilio] WhatsApp message sent to ${whatsappTo} — SID: ${msg.sid}`
    );
    return msg.sid;
  } catch (err) {
    console.error(
      `[Twilio] Failed to send WhatsApp message to ${whatsappTo}:`,
      err.message
    );
    return null;
  }
};

export { sendGuardianSms };

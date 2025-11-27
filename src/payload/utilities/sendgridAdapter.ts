import sgMail from '@sendgrid/mail';

interface SendGridTransportOptions {
  apiKey: string;
}

export function sendGridTransport(options: SendGridTransportOptions) {
  // Ustawienie API Key SendGrid
  sgMail.setApiKey(options.apiKey);

  return {
    name: 'sendgrid',
    version: '1.0.0',

    async send(mail: any, callback: (err: Error | null, info?: any) => void) {
      try {
        const { from, to, subject, html, text } = mail.message;

        const msg = {
          to,
          from,
          subject,
          text: text || '',
          html: html || '',
        };

        const response = await sgMail.send(msg);

        callback(null, {
          envelope: { from, to },
          messageId: response[0]?.headers['x-message-id'] || 'unknown',
        });
      } catch (error) {
        callback(error);
      }
    },
  };
}

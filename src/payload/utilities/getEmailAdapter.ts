import { nodemailerAdapter } from '@payloadcms/email-nodemailer';
import { sendGridTransport } from './email/sendgridAdapter';

export const mailer = nodemailerAdapter({
  defaultFromAddress: 'support@connect211.com',
  defaultFromName: 'Connect 211 Support Team',
  transportOptions: sendGridTransport({
    apiKey: process.env.SENDGRID_API_KEY || '',
  }),
});

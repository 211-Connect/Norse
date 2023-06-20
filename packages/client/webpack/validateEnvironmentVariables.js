const zod = require('zod');

const environmentVariablesSchema = zod.object({
  NEXT_PUBLIC_API_URL: zod.string().nonempty(),
  NEXTAUTH_URL: zod.string().nonempty(),
  NEXTAUTH_SECRET: zod.string().nonempty(),
  KEYCLOAK_SECRET: zod.string().nonempty(),
  KEYCLOAK_CLIENT_ID: zod.string().nonempty(),
  KEYCLOAK_ISSUER: zod.string().nonempty(),
  TWILIO_PHONE_NUMBER: zod.string(),
  TWILIO_ACCOUNT_SID: zod.string(),
  TWILIO_AUTH_TOKEN: zod.string(),
});

module.exports = function validateEnvironmentVariables() {
  const env = process.env;
  try {
    environmentVariablesSchema.parse(env);
  } catch (err) {
    console.error('INVALID ENVIRONMENT VARIABLES', err.errors);
    process.exit(1);
  }
};

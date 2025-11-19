/* eslint-disable @typescript-eslint/consistent-type-definitions */

declare namespace NodeJS {
  interface ProcessEnv {
    DATABASE_URL: string;
    NEXTAUTH_SECRET: string;
    NEXTAUTH_URL?: string;
    RESEND_API_KEY?: string;
    RESEND_FROM_EMAIL?: string;
  }
}

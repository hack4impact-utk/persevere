declare namespace NodeJS {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- augmenting global NodeJS namespace requires interface
  interface ProcessEnv {
    DATABASE_URL: string;
    NEXTAUTH_SECRET: string;
    NEXTAUTH_URL?: string;
    RESEND_API_KEY: string;
    RESEND_FROM_EMAIL: string;
  }
}

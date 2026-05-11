declare namespace NodeJS {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- augmenting global NodeJS namespace requires interface
  interface ProcessEnv {
    DATABASE_URL: string;
    NEXTAUTH_SECRET: string;
    NEXTAUTH_URL?: string;
    GMAIL_USER: string;
    GMAIL_APP_PASSWORD: string;
  }
}

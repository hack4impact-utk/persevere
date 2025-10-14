/* eslint-disable @typescript-eslint/consistent-type-definitions */

declare namespace NodeJS {
  interface ProcessEnv {
    DATABASE_URL: string;
    NEXTAUTH_SECRET: string;
  }
}

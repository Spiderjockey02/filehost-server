declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URL: string;
      NEXTAUTH_SECRET: string;
      FRONTEND_URL: string;
      PORT: string;
      DEBUG: string;
      LIBREOFFICE_PATH: string
    }
  }
}

export {};

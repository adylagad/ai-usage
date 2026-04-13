import { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    login?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    login?: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          // read:user for billing endpoint, read:org for org metrics
          scope: "read:user user:email read:org",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
        token.login = (profile as { login?: string })?.login;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined;
      session.login = token.login as string | undefined;
      return session;
    },
  },
};

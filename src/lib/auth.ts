import NextAuth from "next-auth";
import { NextAuthConfig } from "next-auth";

export const authOptions: NextAuthConfig = {
  providers: [
    {
      id: "oidc",
      name: "OIDC",
      type: "oidc",
      clientId: process.env.OIDC_CLIENT!,
      clientSecret: process.env.OIDC_SECRET!,
      issuer: process.env.OIDC_AUTH_URL?.replace("/oauth2/auth", ""),
      authorization: {
        params: {
          scope: process.env.OIDC_SCOPES?.split(',').join(' ') || "openid profile email",
        },
      },
      token: process.env.OIDC_TOKEN_URL!,
      userinfo: process.env.OIDC_AUTH_URL?.replace("/oauth2/auth", "/oauth2/userinfo"),
      idToken: true,
    },
  ],
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Allow relative URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allow same-origin URLs
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
    async jwt({ token, account, user }) {
      // Initial sign in
      if (account && user) {
        // Register user with backend
        try {
          await fetch(`${process.env.NEXTAUTH_URL}/api/auth/register`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              oidcId: user.id || token.sub,
              email: user.email,
              firstName: user.name?.split(" ")[0],
              lastName: user.name?.split(" ").slice(1).join(" "),
              picture: user.image,
            }),
          }).catch((err) => console.error("Failed to register user:", err));
        } catch (error) {
          console.error("Registration error:", error);
        }

        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          idToken: account.id_token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          },
        };
      }

      // Return previous token if the access token has not expired yet
      return token;
    },
    async session({ session, token }) {
      // Cast token to include user property
      const typedToken = token as {
        user?: { id?: string; email?: string; name?: string; image?: string };
        accessToken?: string;
        refreshToken?: string;
        idToken?: string;
      };

      session.user = {
        ...session.user,
        id: typedToken.user?.id || "",
        email: typedToken.user?.email || "",
        name: typedToken.user?.name || "",
        image: typedToken.user?.image || "",
      };

      session.accessToken = typedToken.accessToken as string;
      session.refreshToken = typedToken.refreshToken as string;
      session.idToken = typedToken.idToken as string;

      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.OIDC_SECRET,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);

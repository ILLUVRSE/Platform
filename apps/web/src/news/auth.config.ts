import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/news/admin/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 2, // 2 hours session window
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role || token.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string }).role = (token as { role?: string }).role;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = (auth?.user as { role?: string } | undefined)?.role;
      const isAdminPage = nextUrl.pathname.startsWith('/news/admin');
      const isSportsEditorPage =
        nextUrl.pathname === '/news/admin/videos' || nextUrl.pathname.startsWith('/news/admin/videos/');
      
      // Allow access to login page
      if (nextUrl.pathname === '/news/admin/login') {
        if (isLoggedIn) {
          const destination = role === 'sports_editor' ? '/news/admin/videos' : '/news/admin/dashboard';
          return Response.redirect(new URL(destination, nextUrl));
        }
        return true;
      }

      if (isAdminPage) {
        if (isLoggedIn && role === 'admin') return true;
        if (isLoggedIn && role === 'sports_editor' && isSportsEditorPage) return true;
        return false; // Redirect unauthenticated users to login page
      }
      return true;
    },
  },
  providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;

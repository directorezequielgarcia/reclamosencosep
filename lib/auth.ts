import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { Rol } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      dni: string;
      rol: Rol;
      prestadoraId: string | null;
    } & DefaultSession["user"];
  }
}

const CredentialsSchema = z.object({
  dni: z.string().min(6).max(12),
  password: z.string().min(4),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/ingresar" },
  providers: [
    Credentials({
      credentials: {
        dni: { label: "DNI", type: "text" },
        password: { label: "Clave", type: "password" },
      },
      async authorize(raw) {
        const parsed = CredentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { dni, password } = parsed.data;

        const u = await prisma.usuario.findUnique({
          where: { dni: dni.replace(/[.\s]/g, "") },
        });
        if (!u || !u.activo) return null;

        const ok = await bcrypt.compare(password, u.passwordHash);
        if (!ok) return null;

        return {
          id: u.id,
          dni: u.dni,
          name: `${u.nombre} ${u.apellido}`,
          email: u.email ?? undefined,
          rol: u.rol,
          prestadoraId: u.prestadoraId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.dni = (user as { dni: string }).dni;
        token.rol = (user as { rol: Rol }).rol;
        token.prestadoraId = (user as { prestadoraId: string | null }).prestadoraId;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.dni = token.dni as string;
      session.user.rol = token.rol as Rol;
      session.user.prestadoraId = (token.prestadoraId ?? null) as string | null;
      return session;
    },
  },
});

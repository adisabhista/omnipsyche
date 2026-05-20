import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const AUTH_CONFIG_ERROR_MESSAGE = "Konfigurasi autentikasi belum lengkap.";

function getAuthSecret() {
    return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
}

const authSecret = getAuthSecret();

if (!authSecret) {
    console.error(`${AUTH_CONFIG_ERROR_MESSAGE} Isi AUTH_SECRET atau NEXTAUTH_SECRET.`);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    secret: authSecret,
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
    },
    providers: [
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Kata Sandi", type: "password" },
            },
            async authorize(credentials) {
                if (!getAuthSecret()) {
                    console.error(`${AUTH_CONFIG_ERROR_MESSAGE} Isi AUTH_SECRET atau NEXTAUTH_SECRET.`);
                    return null;
                }

                try {
                    const [{ prisma }, { loginRequestSchema }, { verifyPassword }] = await Promise.all([
                        import("@/lib/prisma"),
                        import("@/lib/api-validation"),
                        import("@/lib/password"),
                    ]);
                    const parsed = loginRequestSchema.safeParse(credentials);

                    if (!parsed.success) {
                        return null;
                    }

                    const user = await prisma.user.findUnique({
                        where: { email: parsed.data.email },
                    });

                    if (!user) {
                        return null;
                    }

                    const passwordIsValid = await verifyPassword(parsed.data.password, user.passwordHash);

                    if (!passwordIsValid) {
                        return null;
                    }

                    return {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        image: user.image,
                    };
                } catch (error) {
                    console.error("Credentials authorization failed:", error);
                    return null;
                }
            },
        }),
    ],
    callbacks: {
        jwt({ token, user }) {
            if (user?.id) {
                token.sub = user.id;
            }

            return token;
        },
        session({ session, token }) {
            if (session.user && token.sub) {
                session.user.id = token.sub;
            }

            return session;
        },
    },
});

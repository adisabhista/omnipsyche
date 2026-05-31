import { redirect } from "next/navigation";
import LoginForm from "@/app/login/login-form";
import { auth } from "@/lib/auth";

export default async function LoginPage() {
    const session = await auth();

    if (session?.user) {
        redirect("/");
    }

    return <LoginForm />;
}

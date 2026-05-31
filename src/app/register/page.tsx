import { redirect } from "next/navigation";
import RegisterForm from "@/app/register/register-form";
import { auth } from "@/lib/auth";

export default async function RegisterPage() {
    const session = await auth();

    if (session?.user) {
        redirect("/");
    }

    return <RegisterForm />;
}

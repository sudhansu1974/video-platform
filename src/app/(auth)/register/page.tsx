import type { Metadata } from "next";
import { RegisterForm } from "@/components/forms/RegisterForm";

export const metadata: Metadata = {
  title: "Create Account — Video Platform",
};

export default function RegisterPage() {
  return <RegisterForm />;
}

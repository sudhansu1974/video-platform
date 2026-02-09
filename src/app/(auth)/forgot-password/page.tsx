import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/forms/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot Password — Video Platform",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}

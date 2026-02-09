"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { changePassword } from "@/app/actions/profile";
import {
  changePasswordSchema,
  type ChangePasswordInput,
} from "@/lib/validations/profile";

export function ChangePasswordForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError,
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  });

  async function onSubmit(data: ChangePasswordInput) {
    const result = await changePassword(data);
    if (result.success) {
      toast.success("Password changed successfully");
      reset();
    } else {
      if (result.error === "Current password is incorrect") {
        setError("currentPassword", { message: result.error });
      } else {
        toast.error(result.error || "Failed to change password");
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="currentPassword">Current Password</Label>
        <Input
          id="currentPassword"
          type="password"
          {...register("currentPassword")}
          className="border-zinc-700 bg-zinc-800"
        />
        {errors.currentPassword && (
          <p className="text-xs text-red-400">
            {errors.currentPassword.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPassword">New Password</Label>
        <Input
          id="newPassword"
          type="password"
          {...register("newPassword")}
          className="border-zinc-700 bg-zinc-800"
        />
        {errors.newPassword && (
          <p className="text-xs text-red-400">{errors.newPassword.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          {...register("confirmPassword")}
          className="border-zinc-700 bg-zinc-800"
        />
        {errors.confirmPassword && (
          <p className="text-xs text-red-400">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Changing..." : "Change Password"}
      </Button>
    </form>
  );
}

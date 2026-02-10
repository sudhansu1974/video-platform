"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus, Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createUserSchema,
  type CreateUserInput,
} from "@/lib/validations/admin";
import { createUserAdmin } from "@/app/actions/admin";

const roleDescriptions: Record<string, string> = {
  VIEWER: "Can browse and watch videos",
  CREATOR: "Individual creator — can upload and manage videos",
  STUDIO: "Organization account — can upload and manage videos",
  ADMIN: "Full platform access including admin panel",
};

function generatePassword(): string {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*";
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars[byte % chars.length]).join("");
}

export function CreateUserDialog() {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      role: "CREATOR",
    },
  });

  const passwordValue = watch("password");

  async function onSubmit(data: CreateUserInput) {
    setServerError(null);

    const result = await createUserAdmin(data);

    if (!result.success) {
      if (result.error === "Email already in use") {
        setError("email", { message: result.error });
        return;
      }
      if (result.error === "Username already taken") {
        setError("username", { message: result.error });
        return;
      }
      setServerError(result.error);
      return;
    }

    toast.success("User created successfully");
    setOpen(false);
    reset();
    setServerError(null);
  }

  function handleGeneratePassword() {
    const pw = generatePassword();
    setValue("password", pw, { shouldValidate: true });
  }

  async function handleCopyPassword() {
    if (passwordValue) {
      await navigator.clipboard.writeText(passwordValue);
      toast.success("Password copied to clipboard");
    }
  }

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen);
    if (!isOpen) {
      reset();
      setServerError(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 text-white hover:bg-blue-700">
          <UserPlus className="mr-2 h-4 w-4" />
          Create User
        </Button>
      </DialogTrigger>
      <DialogContent className="border-zinc-800 bg-zinc-900 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-zinc-50">Create New User</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Create a user account with a specific role.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <div className="rounded-md bg-red-500/10 p-3 text-sm text-red-400">
              {serverError}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="create-email" className="text-zinc-200">
              Email
            </Label>
            <Input
              id="create-email"
              type="email"
              placeholder="user@example.com"
              className="border-zinc-700 bg-zinc-800 text-zinc-200 placeholder:text-zinc-500"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-red-400">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-username" className="text-zinc-200">
              Username
            </Label>
            <Input
              id="create-username"
              placeholder="johndoe"
              className="border-zinc-700 bg-zinc-800 text-zinc-200 placeholder:text-zinc-500"
              {...register("username")}
            />
            {errors.username && (
              <p className="text-sm text-red-400">{errors.username.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-password" className="text-zinc-200">
              Password
            </Label>
            <div className="flex gap-2">
              <Input
                id="create-password"
                type="text"
                placeholder="Min 8 characters"
                className="border-zinc-700 bg-zinc-800 text-zinc-200 placeholder:text-zinc-500"
                {...register("password")}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0 border-zinc-700 bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
                onClick={handleGeneratePassword}
                title="Generate random password"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0 border-zinc-700 bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
                onClick={handleCopyPassword}
                disabled={!passwordValue}
                title="Copy password"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-400">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-displayName" className="text-zinc-200">
              Display Name{" "}
              <span className="text-zinc-500">(optional)</span>
            </Label>
            <Input
              id="create-displayName"
              placeholder="John Doe"
              className="border-zinc-700 bg-zinc-800 text-zinc-200 placeholder:text-zinc-500"
              {...register("displayName")}
            />
            {errors.displayName && (
              <p className="text-sm text-red-400">
                {errors.displayName.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-200">Role</Label>
            <Select
              defaultValue="CREATOR"
              onValueChange={(value) =>
                setValue(
                  "role",
                  value as CreateUserInput["role"],
                  { shouldValidate: true }
                )
              }
            >
              <SelectTrigger className="border-zinc-700 bg-zinc-800 text-zinc-200">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent className="border-zinc-700 bg-zinc-900">
                {(
                  ["VIEWER", "CREATOR", "STUDIO", "ADMIN"] as const
                ).map((role) => (
                  <SelectItem
                    key={role}
                    value={role}
                    className="text-zinc-200 focus:bg-zinc-800 focus:text-zinc-50"
                  >
                    <div>
                      <span className="font-medium">
                        {role.charAt(0) + role.slice(1).toLowerCase()}
                      </span>
                      <span className="ml-2 text-xs text-zinc-500">
                        — {roleDescriptions[role]}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-red-400">{errors.role.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {isSubmitting ? "Creating..." : "Create User"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

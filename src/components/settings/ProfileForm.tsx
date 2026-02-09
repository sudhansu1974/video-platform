"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { updateProfile } from "@/app/actions/profile";
import {
  updateProfileSchema,
  type UpdateProfileInput,
} from "@/lib/validations/profile";

interface ProfileFormProps {
  defaultValues: {
    name: string;
    bio: string;
    websiteUrl: string;
    location: string;
  };
}

export function ProfileForm({ defaultValues }: ProfileFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues,
  });

  const bioLength = watch("bio")?.length ?? 0;

  async function onSubmit(data: UpdateProfileInput) {
    const result = await updateProfile(data);
    if (result.success) {
      toast.success("Profile updated");
    } else {
      toast.error(result.error || "Failed to update profile");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Display Name</Label>
        <Input
          id="name"
          {...register("name")}
          className="border-zinc-700 bg-zinc-800"
        />
        {errors.name && (
          <p className="text-xs text-red-400">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          {...register("bio")}
          rows={4}
          className="border-zinc-700 bg-zinc-800"
          placeholder="Tell viewers about yourself..."
        />
        <div className="flex justify-between">
          {errors.bio && (
            <p className="text-xs text-red-400">{errors.bio.message}</p>
          )}
          <p className="ml-auto text-xs text-zinc-500">{bioLength}/1000</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="websiteUrl">Website</Label>
        <Input
          id="websiteUrl"
          {...register("websiteUrl")}
          placeholder="https://example.com"
          className="border-zinc-700 bg-zinc-800"
        />
        {errors.websiteUrl && (
          <p className="text-xs text-red-400">{errors.websiteUrl.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          {...register("location")}
          placeholder="City, Country"
          className="border-zinc-700 bg-zinc-800"
        />
        {errors.location && (
          <p className="text-xs text-red-400">{errors.location.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}

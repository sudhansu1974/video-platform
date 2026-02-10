import type { Metadata } from "next";
import Link from "next/link";
import { Upload, Users, Video, Building2, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Start Creating — Video Platform",
  description:
    "Learn about Creator and Studio accounts on Video Platform. Upload videos, build your channel, and reach viewers.",
};

export default function BecomeCreatorPage() {
  return (
    <div className="mx-auto max-w-3xl py-8">
      <div className="text-center">
        <Sparkles className="mx-auto mb-4 h-12 w-12 text-blue-400" />
        <h1 className="text-3xl font-bold text-zinc-50">
          Start Creating on Video Platform
        </h1>
        <p className="mt-3 text-lg text-zinc-400">
          Share your videos with viewers across the platform.
        </p>
      </div>

      {/* Benefits */}
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 text-center">
          <Upload className="mx-auto mb-3 h-8 w-8 text-blue-400" />
          <h3 className="font-medium text-zinc-200">Upload Videos</h3>
          <p className="mt-1 text-sm text-zinc-500">
            Upload and share your content with automatic processing.
          </p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 text-center">
          <Video className="mx-auto mb-3 h-8 w-8 text-purple-400" />
          <h3 className="font-medium text-zinc-200">Build Your Channel</h3>
          <p className="mt-1 text-sm text-zinc-500">
            Create your own channel page to showcase your work.
          </p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 text-center">
          <Users className="mx-auto mb-3 h-8 w-8 text-green-400" />
          <h3 className="font-medium text-zinc-200">Reach Viewers</h3>
          <p className="mt-1 text-sm text-zinc-500">
            Get discovered through search, categories, and the homepage.
          </p>
        </div>
      </div>

      {/* Account Types */}
      <div className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold text-zinc-50">
          Choose Your Account Type
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Creator */}
          <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-6">
            <div className="flex items-center gap-2 mb-3">
              <Video className="h-5 w-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-blue-400">
                Creator
              </h3>
            </div>
            <p className="text-sm text-zinc-300">
              For solo content creators, vloggers, educators, and independent
              filmmakers.
            </p>
            <ul className="mt-3 space-y-1 text-sm text-zinc-400">
              <li className="flex items-center gap-2">
                <ArrowRight className="h-3 w-3 text-blue-400" />
                Upload and manage videos
              </li>
              <li className="flex items-center gap-2">
                <ArrowRight className="h-3 w-3 text-blue-400" />
                Personal channel page
              </li>
              <li className="flex items-center gap-2">
                <ArrowRight className="h-3 w-3 text-blue-400" />
                Creator badge on profile
              </li>
            </ul>
          </div>

          {/* Studio */}
          <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-6">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="h-5 w-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-purple-400">
                Studio
              </h3>
            </div>
            <p className="text-sm text-zinc-300">
              For companies, studios, brands, and teams that produce content
              together.
            </p>
            <ul className="mt-3 space-y-1 text-sm text-zinc-400">
              <li className="flex items-center gap-2">
                <ArrowRight className="h-3 w-3 text-purple-400" />
                Upload and manage videos
              </li>
              <li className="flex items-center gap-2">
                <ArrowRight className="h-3 w-3 text-purple-400" />
                Organization channel page
              </li>
              <li className="flex items-center gap-2">
                <ArrowRight className="h-3 w-3 text-purple-400" />
                Studio badge on profile
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-10 rounded-lg border border-zinc-800 bg-zinc-900 p-6 text-center">
        <h2 className="text-lg font-semibold text-zinc-50">
          Ready to get started?
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          To request a Creator or Studio account, contact the platform
          administrator.
        </p>
        {/* TODO: Build self-service creator application flow with admin approval queue */}
        <div className="mt-4 flex justify-center gap-3">
          <Button asChild variant="outline" className="border-zinc-700 text-zinc-200 hover:bg-zinc-800">
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

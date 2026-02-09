"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

export default function RegisterError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">
          Something went wrong
        </CardTitle>
        <CardDescription>
          An error occurred while loading the registration page.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <Button onClick={reset}>Try again</Button>
      </CardContent>
    </Card>
  );
}

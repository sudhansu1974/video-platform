import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";

export default function LoginLoading() {
  return (
    <Card>
      <CardHeader className="items-center gap-3">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-9 w-full" />
        </div>
        <Skeleton className="h-9 w-full" />
      </CardContent>
      <CardFooter className="justify-center">
        <Skeleton className="h-4 w-52" />
      </CardFooter>
    </Card>
  );
}

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";

export default function RegisterLoading() {
  return (
    <Card>
      <CardHeader className="items-center gap-3">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-56" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
        <Skeleton className="h-9 w-full" />
      </CardContent>
      <CardFooter className="justify-center">
        <Skeleton className="h-4 w-52" />
      </CardFooter>
    </Card>
  );
}

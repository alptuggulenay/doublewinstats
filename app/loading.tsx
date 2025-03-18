import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-12">
      <Card className="w-full max-w-6xl">
        <CardHeader>
          <Skeleton className="h-10 w-[80%] mx-auto" />
          <Skeleton className="h-4 w-[60%] mx-auto mt-4" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-8">
            <section className="space-y-4">
              <Skeleton className="h-8 w-[40%]" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-md">
                <Skeleton className="h-6 w-[30%]" />
                <div className="space-y-2 mt-4">
                  <Skeleton className="h-4 w-[70%]" />
                  <Skeleton className="h-4 w-[60%]" />
                  <Skeleton className="h-4 w-[80%]" />
                  <Skeleton className="h-4 w-[75%]" />
                </div>
              </div>
            </section>
            
            <div>
              <Skeleton className="h-8 w-[40%] mb-4" />
              <div className="rounded-md border p-4">
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </div>
            
            <div>
              <Skeleton className="h-8 w-[40%] mb-4" />
              <div className="rounded-md border p-4">
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
} 
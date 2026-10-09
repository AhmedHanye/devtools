import { BookOpen } from "lucide-react";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center p-8 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <BookOpen className="size-6" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight">
        DevTools Documentation
      </h1>
      <p className="mt-4 text-muted-foreground">
        Documentation platform workspace foundation.
      </p>
    </main>
  );
}

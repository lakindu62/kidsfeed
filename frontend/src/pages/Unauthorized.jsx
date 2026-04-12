import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Button } from '@/components/ui/button';

function Unauthorized() {
  return (
    <main className="from-background via-muted/20 to-background min-h-screen bg-gradient-to-b px-4 py-10">
      <Empty className="border-border/70 bg-card/80 mx-auto mt-10 max-w-2xl border px-6 py-14 shadow-sm backdrop-blur sm:mt-16 sm:px-10">
        <EmptyHeader>
          <EmptyMedia
            variant="icon"
            className="bg-destructive/10 text-destructive"
          >
            <ShieldAlert />
          </EmptyMedia>
          <EmptyTitle>Access denied</EmptyTitle>
          <EmptyDescription>
            You do not have permission to open this page.
          </EmptyDescription>
        </EmptyHeader>

        <EmptyContent>
          <p className="text-muted-foreground max-w-md">
            If this looks wrong, return home and try again after your role has
            been updated.
          </p>

          <Button asChild size="lg" className="mt-2 min-w-40">
            <Link to="/">
              <ArrowLeft />
              Go home
            </Link>
          </Button>
        </EmptyContent>
      </Empty>
    </main>
  );
}

export default Unauthorized;

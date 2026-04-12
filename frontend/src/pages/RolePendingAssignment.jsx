import { ArrowLeft, MailWarning } from 'lucide-react';
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

const supportEmail =
  import.meta.env.VITE_SUPPORT_EMAIL ?? 'local-dev@kidsfeed.com';

function RolePendingAssignment() {
  return (
    <main className="from-background via-muted/20 to-background min-h-screen bg-gradient-to-b px-4 py-10">
      <Empty className="border-border/70 bg-card/80 mx-auto mt-10 max-w-2xl border px-6 py-14 shadow-sm backdrop-blur sm:mt-16 sm:px-10">
        <EmptyHeader>
          <EmptyMedia variant="icon" className="bg-amber-500/10 text-amber-600">
            <MailWarning />
          </EmptyMedia>
          <EmptyTitle>Role not assigned yet</EmptyTitle>
          <EmptyDescription>
            Your account is signed in, but your role has not been assigned or
            refreshed yet.
          </EmptyDescription>
        </EmptyHeader>

        <EmptyContent>
          <p className="text-muted-foreground max-w-md">
            If this was just updated, sign out and sign in again. Otherwise,
            contact an admin to finish your account setup.
          </p>

          <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild variant="outline" size="lg" className="min-w-40">
              <Link to="/">
                <ArrowLeft />
                Go home
              </Link>
            </Button>

            <Button asChild size="lg" className="min-w-40">
              <a
                href={`mailto:${supportEmail}?subject=Kidsfeed%20role%20assignment%20request`}
              >
                <MailWarning />
                Contact admin
              </a>
            </Button>
          </div>
        </EmptyContent>
      </Empty>
    </main>
  );
}

export default RolePendingAssignment;

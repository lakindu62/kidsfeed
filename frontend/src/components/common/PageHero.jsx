import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

function PageHero({
  title,
  description,
  eyebrow,
  actionLabel,
  actionTo,
  actionHref,
  actionTarget,
  actionRel,
  onActionClick,
  actionClassName,
  className,
}) {
  const actionButtonClassName = cn(
    'mt-auto w-fit rounded-[14px] px-6 py-4 typography-body-lg text-white transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
    'bg-[#0f7d2a] hover:bg-[#0d6c25] focus-visible:ring-[#0f7d2a]',
    actionClassName,
  );

  let action = null;

  if (actionLabel && actionTo) {
    action = (
      <Button asChild className={actionButtonClassName}>
        <Link to={actionTo}>{actionLabel}</Link>
      </Button>
    );
  } else if (actionLabel && actionHref) {
    action = (
      <Button asChild className={actionButtonClassName}>
        <a href={actionHref} target={actionTarget} rel={actionRel}>
          {actionLabel}
        </a>
      </Button>
    );
  } else if (actionLabel && onActionClick) {
    action = (
      <Button
        type="button"
        className={actionButtonClassName}
        onClick={onActionClick}
      >
        {actionLabel}
      </Button>
    );
  }

  return (
    <Card
      className={cn(
        'min-h-60 rounded-[20px] bg-[linear-gradient(125deg,#bfe7c1_0%,#c6e9ca_50%,#b2dbb6_100%)] p-0 shadow-[0_1px_2px_rgba(0,0,0,0.04)]',
        className,
      )}
    >
      <CardContent className="flex min-h-60 flex-col p-6">
        {eyebrow ? (
          <p className="typography-body-sm mb-2 tracking-[0.2em] text-[#2c6b37] uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="typography-h1 max-w-[95%] text-[#0f5f1f]">{title}</h2>
        <p className="typography-body-lg mt-4 max-w-[92%] text-[#2c6b37]">
          {description}
        </p>
        {action}
      </CardContent>
    </Card>
  );
}

export default PageHero;

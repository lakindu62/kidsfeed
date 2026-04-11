import { Button } from '@/components/ui/button';
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
    'mt-auto w-fit rounded-[14px] px-6 py-4 text-base font-semibold text-white transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
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
    <article
      className={cn(
        'flex min-h-60 flex-col rounded-[20px] bg-[linear-gradient(125deg,#bfe7c1_0%,#c6e9ca_50%,#b2dbb6_100%)] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]',
        className,
      )}
    >
      {eyebrow ? (
        <p className="mb-2 text-sm font-semibold tracking-[0.2em] text-[#2c6b37] uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="max-w-[95%] text-[2.05rem] leading-tight font-bold tracking-[-0.03em] text-[#0f5f1f]">
        {title}
      </h2>
      <p className="mt-4 max-w-[92%] text-[1.08rem] leading-7 text-[#2c6b37]">
        {description}
      </p>
      {action}
    </article>
  );
}

export default PageHero;

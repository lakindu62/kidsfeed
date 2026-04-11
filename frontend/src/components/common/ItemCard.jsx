import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

function ItemCard({
  title,
  description,
  mediaUrl,
  mediaAlt,
  badges = [],
  details = [],
  actionLabel,
  actionTo,
  actionHref,
  actionTarget,
  actionRel,
  onActionClick,
  className,
}) {
  let action = null;

  if (actionLabel && actionTo) {
    action = (
      <Button
        asChild
        className="w-full rounded-[10px] border border-[#d8ddd7] bg-[#ecf1eb] px-3 py-2 text-sm font-semibold text-[#2d7236] transition-colors hover:bg-[#e2e9e2] focus-visible:ring-2 focus-visible:ring-[#2d7236] focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        <Link to={actionTo}>{actionLabel}</Link>
      </Button>
    );
  } else if (actionLabel && actionHref) {
    action = (
      <Button
        asChild
        className="w-full rounded-[10px] border border-[#d8ddd7] bg-[#ecf1eb] px-3 py-2 text-sm font-semibold text-[#2d7236] transition-colors hover:bg-[#e2e9e2] focus-visible:ring-2 focus-visible:ring-[#2d7236] focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        <a href={actionHref} target={actionTarget} rel={actionRel}>
          {actionLabel}
        </a>
      </Button>
    );
  } else if (actionLabel && onActionClick) {
    action = (
      <Button
        type="button"
        className="w-full rounded-[10px] border border-[#d8ddd7] bg-[#ecf1eb] px-3 py-2 text-sm font-semibold text-[#2d7236] transition-colors hover:bg-[#e2e9e2] focus-visible:ring-2 focus-visible:ring-[#2d7236] focus-visible:ring-offset-2 focus-visible:outline-none"
        onClick={onActionClick}
      >
        {actionLabel}
      </Button>
    );
  }

  return (
    <Card
      className={cn(
        'overflow-hidden rounded-[20px] border border-[#e6e9e5] bg-[#f8f9f8] shadow-[0_1px_2px_rgba(0,0,0,0.04)]',
        className,
      )}
    >
      <div className="relative h-33 overflow-hidden bg-[linear-gradient(135deg,#dfeee0_0%,#c6e4c9_100%)]">
        {mediaUrl ? (
          <img
            src={mediaUrl}
            alt={mediaAlt || title}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : null}

        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(15,23,42,0.34)_0%,rgba(15,23,42,0.05)_45%,rgba(15,23,42,0)_100%)]" />

        {badges.length > 0 ? (
          <div className="absolute top-2 left-2 flex flex-wrap gap-2">
            {badges.map((badge) => (
              <Badge
                key={badge}
                variant="secondary"
                className="cursor-default rounded-full bg-[#dcedc8] px-3 py-1 text-xs font-semibold text-[#2f6f33]"
              >
                {badge}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>

      <CardContent className="px-3 py-3">
        <h3 className="m-0 text-[0.95rem] font-bold tracking-[-0.02em] text-[#2a2a2a]">
          {title}
        </h3>

        {description ? (
          <p className="mt-1.5 mb-2 line-clamp-2 min-h-[2.2rem] overflow-hidden text-[0.77rem] leading-[1.3] text-ellipsis text-[#667]">
            {description}
          </p>
        ) : null}

        {details.length > 0 ? (
          <dl className="mb-3 grid gap-1 text-[0.73rem] text-[#657267]">
            {details.map((detail) => (
              <div
                key={detail.label}
                className="flex items-center justify-between gap-2"
              >
                <dt className="font-medium">{detail.label}</dt>
                <dd className="flex items-center gap-1 text-right">
                  {detail.icon ? detail.icon : null}
                  <span>{detail.value}</span>
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
      </CardContent>

      {action ? (
        <CardFooter className="px-3 pt-0 pb-3">{action}</CardFooter>
      ) : null}
    </Card>
  );
}

export default ItemCard;

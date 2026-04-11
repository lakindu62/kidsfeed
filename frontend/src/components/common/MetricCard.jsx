import { cn } from '@/lib/utils';

function MetricCard({
  icon,
  value,
  label,
  tone = 'default',
  footer,
  className,
}) {
  return (
    <article
      className={cn(
        'flex min-h-44 flex-col justify-center gap-1 rounded-[20px] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]',
        tone === 'highlight' ? 'bg-[#f6d8be]' : 'bg-[#f7f7f7]',
        className,
      )}
    >
      {icon ? <span className="text-[#17602b]">{icon}</span> : null}
      <p className="m-0 text-[2rem] leading-none font-bold tracking-[-0.04em] text-[#1c1c1c]">
        {value}
      </p>
      <p className="m-0 text-sm text-[#666]">{label}</p>
      {footer ? <div className="mt-2">{footer}</div> : null}
    </article>
  );
}

export default MetricCard;

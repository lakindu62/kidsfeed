import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

function ProgressCard({
  title = 'Progress',
  progress = 0,
  valueLabel,
  description,
  className,
}) {
  const displayValue = valueLabel ?? `${progress}%`;

  return (
    <Card
      className={cn(
        'rounded-[20px] border border-[#e6e9e5] bg-[#f7f7f7] p-0 shadow-[0_1px_2px_rgba(0,0,0,0.04)]',
        className,
      )}
    >
      <CardContent className="p-4">
        <div className="mb-3 flex items-center justify-between text-sm text-[#556]">
          <span>{title}</span>
          <strong className="text-[#1a7d32]">{displayValue}</strong>
        </div>
        {description ? (
          <p className="mb-3 text-sm text-[#667]">{description}</p>
        ) : null}
        <Progress
          value={Math.max(0, Math.min(progress, 100))}
          className="h-2 bg-[#d9e2d8] **:data-[slot=progress-indicator]:bg-[linear-gradient(90deg,#0f6f26,#279a45)]"
        />
      </CardContent>
    </Card>
  );
}

export default ProgressCard;

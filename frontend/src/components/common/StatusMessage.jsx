import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

function StatusMessage({ kind = 'info', message, className }) {
  if (!message) {
    return null;
  }

  const toneClassName =
    kind === 'error'
      ? 'mb-4 rounded-[12px] border border-[#f3cece] bg-[#fdecec] text-[#a61e1e]'
      : kind === 'success'
        ? 'mb-4 rounded-[12px] border border-[#cce8d0] bg-[#edf8ef] text-[#1f7a34]'
        : 'py-3 text-center text-[#556]';

  const isCardTone = kind === 'error' || kind === 'success';

  if (!isCardTone) {
    return (
      <p
        className={cn(toneClassName, className)}
        role={kind === 'error' ? 'alert' : 'status'}
      >
        {message}
      </p>
    );
  }

  return (
    <Card
      className={cn(toneClassName, className)}
      role={kind === 'error' ? 'alert' : 'status'}
    >
      <CardContent className="px-4 py-3 text-center">{message}</CardContent>
    </Card>
  );
}

export default StatusMessage;

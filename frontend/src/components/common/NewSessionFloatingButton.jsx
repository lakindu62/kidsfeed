import { Plus } from 'lucide-react';
import { Button } from '../ui/button';

export default function NewSessionFloatingButton({
  onClick,
  label = 'New Session',
}) {
  return (
    <Button
      onClick={onClick}
      size="lg"
      className="typography-body-sm fixed right-8 bottom-8 inline-flex h-12 min-w-[170px] items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#116e20] to-[#006117] px-6 leading-none tracking-[0.01em] whitespace-nowrap text-white shadow-[0px_8px_20px_-8px_rgba(0,97,23,0.5)] transition-all hover:translate-y-[-1px] hover:shadow-[0px_12px_24px_-8px_rgba(0,97,23,0.55)]"
    >
      <span className="grid h-5 w-5 place-items-center rounded-full bg-white/20">
        <Plus className="h-3.5 w-3.5" strokeWidth={2.25} />
      </span>
      <span className="mt-[1px]">{label}</span>
    </Button>
  );
}

function WeeklyGoalCard({ progress }) {
  return (
    <article className="rounded-[20px] border border-[#e6e9e5] bg-[#f7f7f7] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="mb-3 flex items-center justify-between text-sm text-[#556]">
        <span>Weekly Goal</span>
        <strong className="text-[#1a7d32]">{progress}%</strong>
      </div>
      <div className="h-2 rounded-full bg-[#d9e2d8]">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#0f6f26,#279a45)]"
          style={{ width: `${progress}%` }}
        />
      </div>
    </article>
  );
}

export default WeeklyGoalCard;

function MenuHero({ title, description, ctaLabel, onCtaClick }) {
  return (
    <article className="flex min-h-[15rem] flex-col rounded-[20px] bg-[linear-gradient(125deg,#bfe7c1_0%,#c6e9ca_50%,#b2dbb6_100%)] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <h2 className="max-w-[95%] text-[2.05rem] leading-tight font-bold tracking-[-0.03em] text-[#0f5f1f]">
        {title}
      </h2>
      <p className="mt-4 max-w-[92%] text-[1.08rem] leading-7 text-[#2c6b37]">
        {description}
      </p>
      {ctaLabel ? (
        <button
          type="button"
          className="mt-auto w-fit rounded-[14px] bg-[#0f7d2a] px-6 py-4 text-base font-semibold text-white transition-colors hover:bg-[#0d6c25] focus-visible:ring-2 focus-visible:ring-[#0f7d2a] focus-visible:ring-offset-2 focus-visible:outline-none"
          onClick={onCtaClick}
        >
          {ctaLabel}
        </button>
      ) : null}
    </article>
  );
}

export default MenuHero;

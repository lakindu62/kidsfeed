function PageLoadingScreen({ message = 'Loading page...' }) {
  return (
    <div className="fixed inset-0 z-120 flex items-center justify-center bg-white/88 backdrop-blur-[1px]">
      <div className="flex min-w-55 flex-col items-center gap-3 rounded-2xl border border-[#dfe5df] bg-white px-6 py-5 shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
        <span className="h-9 w-9 animate-spin rounded-full border-4 border-[#d6ead9] border-t-[#0f7d2a]" />
        <p className="text-sm font-semibold text-[#1f7a34]">{message}</p>
      </div>
    </div>
  );
}

export default PageLoadingScreen;

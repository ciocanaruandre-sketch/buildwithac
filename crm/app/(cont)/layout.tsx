export default function LayoutCont({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center p-4">
      <div className="sticla w-full max-w-[380px] rounded-xl2 p-7">
        <div className="mb-6 flex items-center gap-2.5">
          <i className="block h-[26px] w-[26px] rounded-[8px] shadow-[inset_0_1px_0_rgba(255,255,255,.4)]" style={{ background: "var(--grad)" }} />
          <div className="text-[15px] leading-tight font-semibold tracking-[-.01em]">
            buildwithac
            <small className="block text-[11.5px] font-medium tracking-normal text-ink-3">CRM</small>
          </div>
        </div>
        {children}
      </div>
    </main>
  );
}

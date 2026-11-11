export default function LayoutCont({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center p-4">
      <div className="panel w-full max-w-[360px] p-6">
        <div className="mb-6 flex items-center gap-2.5">
          <i className="block h-[22px] w-[22px] rounded-r" style={{ background: "var(--grad)" }} />
          <div>
            <b className="block text-[15px] font-bold">buildwithac</b>
            <small className="lbl">CRM</small>
          </div>
        </div>
        {children}
      </div>
    </main>
  );
}

const serviceItems = [
  { label: "Health", value: "/api/health" },
  { label: "License checks", value: "/api/licenses/check" },
  { label: "Admin licenses", value: "/api/admin/licenses" },
];

export default function Page() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        background: "#f7faf9",
        color: "#17201d",
      }}>
      <section
        style={{
          width: "100%",
          maxWidth: 640,
          border: "1px solid #d7e1dc",
          borderRadius: 8,
          background: "#ffffff",
          padding: 32,
          boxShadow: "0 16px 48px rgba(25, 40, 34, 0.08)",
        }}>
        <p style={{ margin: "0 0 8px", color: "#477265", fontSize: 14, fontWeight: 700 }}>
          Continium License Server
        </p>
        <h1 style={{ margin: "0 0 12px", fontSize: 28, lineHeight: 1.2 }}>Service online</h1>
        <p style={{ margin: "0 0 24px", color: "#4b5b55", lineHeight: 1.6 }}>
          This deployment serves license validation APIs for Continium EDC. Use the health endpoint to
          verify database connectivity.
        </p>
        <dl style={{ display: "grid", gap: 12, margin: 0 }}>
          {serviceItems.map((item) => (
            <div
              key={item.value}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 16,
                borderTop: "1px solid #eef3f1",
                paddingTop: 12,
              }}>
              <dt style={{ color: "#5b6d66" }}>{item.label}</dt>
              <dd style={{ margin: 0, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}

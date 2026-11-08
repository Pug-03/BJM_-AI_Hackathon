"use client";

/** Last-resort boundary (root layout failed): no i18n or styles available, so plain bilingual HTML. */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          margin: 0,
          display: "grid",
          placeItems: "center",
          minHeight: "100dvh",
          background: "#fff",
          color: "#0f0e12",
        }}
      >
        <main style={{ maxWidth: 480, padding: 16 }}>
          <h1 style={{ fontSize: 28, margin: "0 0 8px" }}>Something went wrong</h1>
          <p lang="th" style={{ margin: "0 0 4px" }}>
            เกิดข้อผิดพลาด
          </p>
          <p style={{ color: "#55525f" }}>Please try again in a moment. · โปรดลองอีกครั้งในอีกสักครู่</p>
          <button
            onClick={reset}
            style={{
              marginTop: 16,
              height: 48,
              padding: "0 20px",
              borderRadius: 999,
              border: 0,
              background: "#0f0e12",
              color: "#fff",
              fontSize: 16,
            }}
          >
            Try again · ลองอีกครั้ง
          </button>
        </main>
      </body>
    </html>
  );
}

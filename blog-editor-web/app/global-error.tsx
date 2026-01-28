"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div style={{ textAlign: "center", maxWidth: "400px" }}>
            <h2
              style={{
                fontSize: "1.5rem",
                marginBottom: "1rem",
                color: "#1a1a1a",
              }}
            >
              Something went wrong
            </h2>
            <p
              style={{
                marginBottom: "1.5rem",
                color: "#666",
              }}
            >
              A critical error occurred. Please try again.
            </p>
            <button
              onClick={reset}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "0.375rem",
                border: "1px solid #ccc",
                cursor: "pointer",
                backgroundColor: "#fff",
                fontSize: "1rem",
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

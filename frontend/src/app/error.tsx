"use client";

import { useEffect } from "react";

export default function ErrorBoundary({ 
  error, 
  reset 
}: { 
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console for debugging
    console.error("Application error:", error);
  }, [error]);

  return (
    <div style={{
      padding: 24,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      textAlign: "center"
    }}>
      <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Application Error</h2>
      <p style={{ marginBottom: "1rem", color: "#666" }}>
        {error.message || "A client-side exception has occurred"}
      </p>
      <button 
        onClick={reset}
        style={{
          padding: "0.5rem 1rem",
          backgroundColor: "#0070f3",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer"
        }}
      >
        Try again
      </button>
      {process.env.NODE_ENV === "development" && (
        <details style={{ marginTop: "1rem", textAlign: "left" }}>
          <summary style={{ cursor: "pointer" }}>Error Details</summary>
          <pre style={{ 
            marginTop: "0.5rem", 
            padding: "0.5rem", 
            backgroundColor: "#f5f5f5", 
            borderRadius: "4px",
            overflow: "auto"
          }}>
            {error.stack}
          </pre>
        </details>
      )}
    </div>
  );
}

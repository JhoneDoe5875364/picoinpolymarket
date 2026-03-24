import React, { useState } from "react";

interface AttestationModalProps {
  userId: string;
  onConfirmed: () => void;
}

export const AttestationModal: React.FC<AttestationModalProps> = ({ userId, onConfirmed }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checked, setChecked] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/attestation/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmed: true, user_id: userId })
      });
      if (!res.ok) throw new Error("Attestation failed");
      onConfirmed();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Geolocation Attestation</h2>
        <p>You must check the box below to proceed.</p>
        <label>
          <input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)} disabled={loading} />
          I confirm that I am not accessing this service from a restricted region.
        </label>
        {error && <div className="error">{error}</div>}
        <button onClick={handleConfirm} disabled={!checked || loading}>
          {loading ? "Processing..." : "Confirm"}
        </button>
      </div>
    </div>
  );
};

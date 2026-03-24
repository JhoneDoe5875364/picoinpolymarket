export type SuggestionInput = {
  question: string;
  description?: string;
  category?: string;
  resolves_at?: string | null;
};

export async function submitSuggestion(input: SuggestionInput) {
  const res = await fetch("/api/suggestions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || "Failed to submit suggestion");
  return json as { ok:true; id:string; created_at:string };
}

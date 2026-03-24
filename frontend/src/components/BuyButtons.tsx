"use client";

type Props = { id: string };

export default function BuyButtons({ id }: Props) {
  // Minimal, build-safe buttons. Your QuickBuyModal/flow can listen to this event.
  function fire(side: "YES" | "NO") {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("predictpix:buy", { detail: { id, side } })
      );
    }
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => fire("YES")}
        className="px-4 py-2 rounded-md border"
        aria-label="Buy Yes"
      >
        Buy Yes
      </button>
      <button
        type="button"
        onClick={() => fire("NO")}
        className="px-4 py-2 rounded-md border"
        aria-label="Buy No"
      >
        Buy No
      </button>
    </div>
  );
}

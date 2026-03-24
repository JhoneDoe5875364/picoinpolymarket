export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="animate-spin h-8 w-8 rounded-full border-4 border-white border-t-transparent" />
    </div>
  );
}

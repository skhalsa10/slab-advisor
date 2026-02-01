'use client';

const PRODUCTION_PROJECT_ID = 'syoxdgxffdvvpguzvcxo';

export default function EnvironmentBadge() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const isProduction = supabaseUrl.includes(PRODUCTION_PROJECT_ID);

  if (isProduction || !supabaseUrl) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 rounded-full bg-amber-500/80 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-lg backdrop-blur-sm pointer-events-none select-none"
    >
      GAMMA
    </div>
  );
}

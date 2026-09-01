import { Clock, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';

export function PendingScreen() {
  const { signOut } = useAuth();
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink px-4">
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-hotpink/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-gold/10 blur-3xl" />
      <div className="relative w-full max-w-md text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-pinkline bg-ink-100 shadow-glow">
          <Clock className="text-hotpink" size={30} />
        </div>
        <h1 className="font-display text-3xl text-snow">Awaiting Approval</h1>
        <p className="mt-3 text-sm leading-relaxed text-snow-dim">
          Your account is awaiting approval from an academy administrator.
          You'll be able to access the academy once your account has been
          approved. Check back soon.
        </p>
        <div className="mt-6">
          <Button variant="ghost" onClick={signOut}>
            <LogOut size={15} /> Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import {
  Scissors,
  LogOut,
  Crown,
  GraduationCap,
  Settings as SettingsIcon,
  CreditCard,
  ChevronDown,
  Menu,
  X,
  Briefcase,
  Phone,
  ShieldCheck,
  Scroll,
  Calendar as CalendarIcon,
  BookOpen,
  MessageSquare,
  Users,
  Film,
  Shield,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Avatar } from '@/components/ui/Avatar';

export type TabId =
  | 'learning-hub'
  | 'mentorship'
  | 'business-tools'
  | 'coaching-calls'
  | 'certifications'
  | 'doctrine'
  | 'community'
  | 'members'
  | 'premium-library'
  | 'calendar'
  | 'mentor-studio'
  | 'admin'
  | 'settings';

interface NavBarProps {
  active: TabId;
  onChange: (id: TabId) => void;
}

export function NavBar({ active, onChange }: NavBarProps) {
  const { user, signOut, profile } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const isAdmin = profile?.is_admin === true;
  const isMentorship = profile?.tier === 'mentorship' || isAdmin;
  const displayName = profile?.display_name || user?.email || 'Member';

  const tabs: { id: TabId; label: string; icon: any; isGold?: boolean }[] = [
    { id: 'learning-hub', label: 'Classroom Hub', icon: BookOpen },
    { id: 'mentorship', label: '12-Week Mentorship', icon: Crown, isGold: true },
    { id: 'business-tools', label: 'Business Tools', icon: Briefcase, isGold: true },
    { id: 'coaching-calls', label: 'Coaching Calls', icon: Phone },
    { id: 'certifications', label: 'Certifications', icon: ShieldCheck },
    { id: 'doctrine', label: 'The Doctrine', icon: Scroll },
    { id: 'community', label: 'Community', icon: MessageSquare },
    { id: 'premium-library', label: 'Video Vault', icon: Film },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
    ...(isAdmin ? [{ id: 'mentor-studio' as TabId, label: 'Mentor Studio', icon: GraduationCap, isGold: true }] : []),
    ...(isAdmin ? [{ id: 'admin' as TabId, label: 'Admin Desk', icon: Shield }] : []),
  ];

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleSelect = (id: TabId) => {
    onChange(id);
    setProfileOpen(false);
    setMobileOpen(false);
  };

  const tabClass = (id: TabId, isGold?: boolean) =>
    `relative flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
      active === id
        ? isGold
          ? 'text-gold bg-gold/15 border border-gold/40 shadow-gold-glow'
          : 'text-forest-light bg-forest-200 border border-forest-400/50 shadow-forest-glow'
        : isGold
        ? 'text-gold/75 hover:text-gold hover:bg-forest-100/50'
        : 'text-ivory-muted hover:text-ivory hover:bg-forest-100/50'
    }`;

  const underline = (id: TabId, isGold?: boolean) =>
    active === id && (
      <span
        className={`absolute inset-x-2 -bottom-px h-0.5 rounded-full ${
          isGold ? 'bg-gold' : 'bg-forest-light'
        }`}
      />
    );

  return (
    <header className="sticky top-0 z-50 border-b border-goldline/30 bg-forest-50/95 backdrop-blur-md">
      {/* Top row: brand + profile */}
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 sm:px-6">
        <button onClick={() => handleSelect('learning-hub')} className="flex shrink-0 items-center gap-3 text-left">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-goldline bg-forest-100 shadow-gold-glow">
            <Scissors className="text-gold" size={20} />
          </span>
          <div>
            <div className="font-display text-lg sm:text-xl font-bold text-ivory leading-tight flex items-center gap-1.5">
              Oh Sew Sheek <span className="text-gold font-normal italic">Academy</span>
            </div>
            <div className="text-[10px] text-earth-tan tracking-widest uppercase font-semibold flex items-center gap-1">
              <Sparkles size={10} className="text-gold" /> Master Coaching Platform
            </div>
          </div>
        </button>

        {/* Profile menu — desktop */}
        <div ref={profileRef} className="relative ml-auto hidden md:block">
          <button
            onClick={() => setProfileOpen((v) => !v)}
            className="flex items-center gap-2 rounded-full border border-goldline/50 bg-forest-100/80 py-1 pl-1 pr-3 transition-colors hover:border-gold shadow-sm"
          >
            <Avatar name={displayName} src={profile?.avatar_url} size={28} />
            <span className="max-w-[130px] truncate text-xs font-semibold text-ivory">{displayName}</span>
            <ChevronDown size={14} className={`text-gold transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
          </button>
          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-2xl border border-goldline bg-forest-100 shadow-gold-glow">
              <div className="px-4 py-3 border-b border-white/5 bg-forest-200/50">
                <div className="text-xs font-bold text-ivory truncate">{displayName}</div>
                <div className="text-[10px] text-gold uppercase tracking-wider font-semibold mt-0.5">
                  {profile?.tier === 'mentorship' ? '👑 Mentorship Tier' : '🎓 Academy Member'}
                </div>
              </div>
              <button
                onClick={() => handleSelect('settings')}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs text-ivory-dim transition-colors hover:bg-white/5 hover:text-ivory"
              >
                <SettingsIcon size={14} /> Profile & Settings
              </button>
              {isMentorship && (
                <button
                  onClick={() => handleSelect('mentorship')}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs text-gold transition-colors hover:bg-white/5"
                >
                  <CreditCard size={14} /> Mentorship Billing
                </button>
              )}
              {isAdmin && (
                <button
                  onClick={() => handleSelect('admin')}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs text-forest-light transition-colors hover:bg-white/5"
                >
                  <Shield size={14} /> Admin Member Desk
                </button>
              )}
              <div className="border-t border-white/5" />
              <button
                onClick={signOut}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs text-error-soft transition-colors hover:bg-white/5"
              >
                <LogOut size={14} /> Log Out
              </button>
            </div>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg border border-goldline bg-forest-100 text-ivory md:hidden"
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Nav tabs row — desktop */}
      <div className="border-t border-goldline/20 bg-earth-50/50">
        <nav className="mx-auto hidden max-w-7xl items-center justify-start gap-1 px-4 py-1.5 md:flex sm:px-6 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => handleSelect(tab.id)} className={tabClass(tab.id, tab.isGold)}>
                <Icon size={13} />
                {tab.label}
                {underline(tab.id, tab.isGold)}
              </button>
            );
          })}
        </nav>

        {/* Mobile: horizontal scroll nav */}
        <nav className="mx-auto flex max-w-7xl items-center gap-1 px-4 py-1.5 md:hidden overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => handleSelect(tab.id)} className={tabClass(tab.id, tab.isGold)}>
                <Icon size={12} />
                {tab.label}
                {underline(tab.id, tab.isGold)}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Mobile dropdown — profile actions */}
      {mobileOpen && (
        <div className="border-t border-goldline bg-forest-100/98 backdrop-blur-md md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            <div className="mb-2 flex items-center gap-3 pb-2 border-b border-white/10">
              <Avatar name={displayName} src={profile?.avatar_url} size={32} />
              <div>
                <span className="block text-xs font-bold text-ivory">{displayName}</span>
                <span className="text-[10px] text-gold uppercase tracking-wider">{profile?.tier === 'mentorship' ? 'Mentorship Tier' : 'Academy Member'}</span>
              </div>
            </div>
            <button
              onClick={() => handleSelect('settings')}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-ivory hover:bg-white/5"
            >
              <SettingsIcon size={14} /> Profile & Settings
            </button>
            {isMentorship && (
              <button
                onClick={() => handleSelect('mentorship')}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-gold hover:bg-white/5"
              >
                <CreditCard size={14} /> Mentorship Billing
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => handleSelect('admin')}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-forest-light hover:bg-white/5"
              >
                <Shield size={14} /> Admin Member Desk
              </button>
            )}
            <button
              onClick={signOut}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-error-soft hover:bg-white/5"
            >
              <LogOut size={14} /> Log Out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

export default NavBar;

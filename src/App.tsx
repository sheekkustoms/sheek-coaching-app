import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/lib/auth';
import { updatePresence, updateStreak } from '@/lib/supabase';
import { NavBar, type TabId } from '@/components/NavBar';
import { AuthScreen } from '@/components/AuthScreen';
import { PendingScreen } from '@/components/PendingScreen';
import { LearningHub } from '@/components/classroom/LearningHub';
import { CourseDetail } from '@/components/classroom/CourseDetail';
import { Calendar } from '@/components/Calendar';
import { Settings } from '@/components/Settings';
import { UpgradeBanner } from '@/components/UpgradeBanner';
import { MentorshipDashboard } from '@/components/MentorshipDashboard';
import { MentorshipUpgradePage } from '@/components/MentorshipUpgradePage';
import { MentorAdminDashboard } from '@/components/MentorAdminDashboard';
import { BusinessToolsView } from '@/components/BusinessToolsView';
import { CoachingCallsView } from '@/components/CoachingCallsView';
import { CertificationsView } from '@/components/CertificationsView';
import { DoctrineView } from '@/components/DoctrineView';
import { Community } from '@/components/Community';
import { Members } from '@/components/Members';
import { PremiumLibrary } from '@/components/PremiumLibrary';
import { AdminPanel } from '@/components/AdminPanel';
import { Loader2 } from 'lucide-react';
import type { CourseWithSections } from '@/lib/types';

function AcademyApp() {
  const { session, profile, authLoading } = useAuth();
  const [tab, setTab] = useState<TabId>('learning-hub');
  const [openCourseId, setOpenCourseId] = useState<string | null>(null);
  const [purchaseFlash, setPurchaseFlash] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    const courseId = params.get('course');
    if (status === 'success' && courseId) {
      setPurchaseFlash('Payment successful! Your course is now unlocked.');
      setOpenCourseId(null);
      setTab('learning-hub');
      const url = new URL(window.location.href);
      url.searchParams.delete('status');
      url.searchParams.delete('course');
      window.history.replaceState({}, '', url.toString());
      const t = setTimeout(() => setPurchaseFlash(null), 5000);
      return () => clearTimeout(t);
    }
    const upgradeStatus = params.get('upgrade');
    if (upgradeStatus === 'success') {
      setPurchaseFlash('Welcome to Mentorship! Your upgrade is being processed.');
      const url = new URL(window.location.href);
      url.searchParams.delete('upgrade');
      window.history.replaceState({}, '', url.toString());
      const t = setTimeout(() => setPurchaseFlash(null), 6000);
      return () => clearTimeout(t);
    }
    if (upgradeStatus === 'cancelled') {
      const url = new URL(window.location.href);
      url.searchParams.delete('upgrade');
      window.history.replaceState({}, '', url.toString());
    }
    if (status === 'cancelled') {
      const url = new URL(window.location.href);
      url.searchParams.delete('status');
      url.searchParams.delete('course');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  // Presence and active streak tracking
  useEffect(() => {
    if (session?.user && profile && !profile.is_admin) {
      updatePresence(session.user.id, tab);
    }
  }, [tab, session?.user, profile]);

  useEffect(() => {
    if (!session?.user) return;
    const userId = session.user.id;
    const timer = setTimeout(() => {
      updateStreak(userId);
    }, 15 * 60 * 1000);

    return () => clearTimeout(timer);
  }, [session?.user]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink text-snow-dim">
        <Loader2 className="animate-spin" size={28} />
      </div>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink text-snow-dim">
        <Loader2 className="animate-spin" size={28} />
      </div>
    );
  }

  if (profile.status !== 'approved') {
    return <PendingScreen />;
  }

  const isMentorship = profile.tier === 'mentorship' || profile.is_admin;

  const handleTabChange = (id: TabId) => {
    setOpenCourseId(null);
    setTab(id);
  };

  const openCourse = (course: CourseWithSections) => {
    setOpenCourseId(course.id);
    setTab('learning-hub');
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-ink" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <NavBar active={tab} onChange={handleTabChange} />

      {tab === 'mentorship' ? (
        isMentorship ? (
          <MentorshipDashboard />
        ) : (
          <MentorshipUpgradePage />
        )
      ) : tab === 'mentor-studio' && profile.is_admin ? (
        <MentorAdminDashboard />
      ) : tab === 'admin' && profile.is_admin ? (
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <AdminPanel />
        </main>
      ) : tab === 'business-tools' ? (
        <BusinessToolsView profile={profile} />
      ) : tab === 'coaching-calls' ? (
        <CoachingCallsView profile={profile} />
      ) : tab === 'certifications' ? (
        <CertificationsView profile={profile} />
      ) : tab === 'doctrine' ? (
        <DoctrineView profile={profile} />
      ) : (
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          {purchaseFlash && (
            <div className="mx-auto mb-6 max-w-3xl rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold-soft">
              {purchaseFlash}
            </div>
          )}
          {tab !== 'mentorship' && !isMentorship && <UpgradeBanner />}
          {tab === 'learning-hub' ? (
            openCourseId ? (
              <CourseDetail courseId={openCourseId} onBack={() => setOpenCourseId(null)} />
            ) : (
              <LearningHub onOpenCourse={openCourse} />
            )
          ) : tab === 'community' ? (
            <Community />
          ) : tab === 'members' ? (
            <Members />
          ) : tab === 'premium-library' ? (
            <PremiumLibrary />
          ) : tab === 'calendar' ? (
            <Calendar category="general" />
          ) : tab === 'settings' ? (
            <Settings />
          ) : (
            <LearningHub onOpenCourse={openCourse} />
          )}
        </main>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AcademyApp />
    </AuthProvider>
  );
}

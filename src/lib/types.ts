export interface Course {
  id: string;
  title: string;
  created_at: string;
  thumbnail_url?: string | null;
  price?: number | null;
}

export interface CoursePurchase {
  id: string;
  user_id: string;
  course_id: string;
  stripe_session_id: string | null;
  amount_paid: number | null;
  purchased_at: string;
}

export interface Section {
  id: string;
  title: string;
  course_id: string;
  position: number;
  created_at: string;
}

export interface Lesson {
  id: string;
  title: string;
  body: string | null;
  published: boolean;
  section_id: string;
  position: number;
  created_at: string;
  pdf_url?: string | null;
  video_url?: string | null;
  image_url?: string | null;
}

export interface SectionWithLessons extends Section {
  lessons: Lesson[];
}

export interface CourseWithSections extends Course {
  sections: SectionWithLessons[];
}

export type MemberStatus = 'pending' | 'approved' | 'removed';

export type PermissionKey = 'approve_members' | 'moderate_posts' | 'manage_content';

export type MemberPermissions = Partial<Record<PermissionKey, boolean>>;

export type MemberTier = 'member' | 'mentorship';

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  email: string | null;
  status: MemberStatus;
  is_admin: boolean;
  permissions: MemberPermissions;
  tier: MemberTier;
  created_at: string;
}

export interface AdminMember {
  id: string;
  display_name: string;
  email: string | null;
  avatar_url: string | null;
  status: MemberStatus;
  is_admin: boolean;
  permissions: MemberPermissions;
  tier: MemberTier;
  created_at: string;
}

export interface Post {
  id: string;
  body: string;
  user_id: string;
  created_at: string;
  image_url?: string | null;
  profiles?: Profile | null;
  comments?: Comment[];
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  parent_id: string | null;
  image_url: string | null;
  created_at: string;
  profiles?: { display_name: string; avatar_url: string | null; tier: MemberTier } | null;
  replies?: Comment[];
}

export interface MentorshipProgress {
  id: string;
  user_id: string;
  week_number: number;
  completed: boolean;
  completed_at: string | null;
}

export interface MentorshipDeliverable {
  id: string;
  user_id: string;
  week_number: number;
  checklist_state: Record<string, boolean>;
  notes: string | null;
  submitted_at: string;
}

export interface MentorshipSubscription {
  id: string;
  user_id: string;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  status: string;
  created_at: string;
}

export interface AcademyEvent {
  id: string;
  title: string;
  event_date: string;
  description: string | null;
  user_id: string;
  created_at: string;
}

export interface MentorWeekPlan {
  id: string;
  week_number: number;
  teaching_objective: string | null;
  talking_points: string | null;
  prep_checklist: string | null;
  common_struggles: string | null;
  mentor_notes: string | null;
  session_script: string | null;
  updated_at: string;
}

export interface MentorWeekFile {
  id: string;
  week_number: number;
  file_name: string;
  file_path: string;
  file_size: number | null;
  file_type: string | null;
  description: string | null;
  created_at: string;
}

export type FeedbackStatus = 'reviewed' | 'needs_revision' | 'approved';

export interface MentorDeliverableFeedback {
  id: string;
  deliverable_id: string;
  student_id: string;
  feedback_text: string;
  status: FeedbackStatus;
  created_at: string;
}

export interface StudentDeliverableWithProfile extends MentorshipDeliverable {
  profiles?: { display_name: string; email: string | null } | null;
  mentor_deliverable_feedback?: MentorDeliverableFeedback | null;
}

export type BusinessStage = 'just_starting' | 'established';

export interface MentorshipIntake {
  id: string;
  user_id: string;
  business_stage: BusinessStage;
  intake_responses: Record<string, string>;
  game_plan: string | null;
  created_at: string;
  updated_at: string;
}

export interface MentorshipIntakeWithProfile extends MentorshipIntake {
  profiles?: { display_name: string; email: string | null } | null;
}

export interface MentorshipVideo {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  position: number;
  published: boolean;
  created_at: string;
}

export interface MentorshipWeekContent {
  week_number: number;
  title: string;
  title_em: string;
  intro: string;
  body_html: string | null;
  video_url: string | null;
  pdf_url: string | null;
  image_url: string | null;
  deliverable_label: string;
  deliverable_items: string[];
  deliverable_submit_label: string;
  deliverable_placeholder: string;
  deliverable_btn_text: string;
  updated_at: string;
}

export interface MentorshipLesson {
  id: string;
  week_number: number;
  position: number;
  title: string;
  subtitle: string | null;
  lesson_type: string;
  tool_id: string | null;
  figure_out: string[];
  leave_with: string[];
  come_ready: string[];
  body_html: string | null;
  video_url: string | null;
  pdf_url: string | null;
  image_url: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface VideoLibraryItem {
  id: string;
  title: string;
  description: string | null;
  vimeo_url: string | null;
  thumbnail_emoji: string;
  category: string;
  published_at: string | null;
  is_visible: boolean;
  sort_order: number;
  created_at: string;
  thumbnail_url: string | null;
  resource_pdf_url: string | null;
  templates_zip_url: string | null;
}

export interface EmailLogEntry {
  id: string;
  sender_id: string | null;
  recipients: string[];
  recipient_user_ids: string[];
  subject: string;
  body: string;
  status: string;
  error_message: string | null;
  sent_at: string;
}

export interface CoachingCall {
  id: string;
  title: string;
  date: string;
  zoom_link: string;
  replay_url: string;
  status: 'upcoming' | 'replay' | 'cancelled';
  is_visible: boolean;
  show_on_dashboard: boolean;
  duration_minutes: number;
  created_at: string;
}

export interface CallQuestion {
  id: string;
  user_id: string | null;
  name: string;
  question: string;
  created_at: string;
}

export interface AvailabilitySlot {
  id: string;
  slot_date: string;
  slot_time: string;
  duration_minutes: number;
  timezone: string;
  zoom_link: string;
  notes: string;
  is_available: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  is_pinned: boolean;
  badge_label: string | null;
  published_at: string;
  created_at: string;
  show_on_dashboard: boolean;
  is_draft: boolean;
}

export interface Certification {
  id: string;
  course_id: string;
  label: string;
  emoji: string;
  sort_order: number;
  is_published: boolean;
  show_on_dashboard: boolean;
  created_at: string;
  course_title?: string;
  course_lesson_count?: number;
}


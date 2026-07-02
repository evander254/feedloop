interface IllustrationProps {
  className?: string;
}

export function FormsIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 80 80" fill="none" className={className}>
      <rect x="8" y="4" width="64" height="72" rx="8" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <line x1="20" y1="20" x2="60" y2="20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="20" y1="30" x2="52" y2="30" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="20" y1="40" x2="56" y2="40" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="20" y1="50" x2="44" y2="50" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="62" cy="16" r="10" fill="currentColor" opacity="0.15" />
      <path d="M58 16l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
    </svg>
  );
}

export function SurveysIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 80 80" fill="none" className={className}>
      <rect x="10" y="6" width="60" height="68" rx="8" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <circle cx="22" cy="20" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <line x1="34" y1="20" x2="60" y2="20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="22" cy="34" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <line x1="34" y1="34" x2="56" y2="34" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="22" cy="48" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <line x1="34" y1="48" x2="52" y2="48" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="58" cy="62" r="12" fill="currentColor" opacity="0.12" />
      <path d="M54 62l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
    </svg>
  );
}

export function PollsIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 80 80" fill="none" className={className}>
      <rect x="10" y="8" width="24" height="64" rx="4" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <rect x="10" y="8" width="24" height="24" rx="4" fill="currentColor" opacity="0.15" />
      <rect x="40" y="28" width="30" height="44" rx="4" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <rect x="40" y="28" width="30" height="18" rx="4" fill="currentColor" opacity="0.12" />
    </svg>
  );
}

export function AnalyticsIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 80 80" fill="none" className={className}>
      <rect x="6" y="10" width="68" height="60" rx="8" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M14 58l16-20 14 10 18-24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="62" cy="24" r="4" fill="currentColor" opacity="0.3" />
      <circle cx="44" cy="48" r="4" fill="currentColor" opacity="0.2" />
      <circle cx="30" cy="38" r="4" fill="currentColor" opacity="0.25" />
    </svg>
  );
}

export function OrganizationsIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 80 80" fill="none" className={className}>
      <rect x="6" y="6" width="28" height="28" rx="6" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <rect x="46" y="6" width="28" height="12" rx="4" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <rect x="46" y="22" width="28" height="12" rx="4" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <rect x="6" y="46" width="28" height="28" rx="6" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <rect x="46" y="46" width="28" height="28" rx="6" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

export function ExportIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 80 80" fill="none" className={className}>
      <rect x="12" y="8" width="56" height="64" rx="6" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <line x1="24" y1="24" x2="56" y2="24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="24" y1="34" x2="56" y2="34" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="24" y1="44" x2="44" y2="44" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M56 58l6-6-6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="62" y1="52" x2="62" y2="66" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M48 62h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function FeedbackIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 80 80" fill="none" className={className}>
      <path d="M14 12h52a6 6 0 016 6v32a6 6 0 01-6 6H34l-12 10v-10h-8a6 6 0 01-6-6V18a6 6 0 016-6z" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <circle cx="28" cy="34" r="3" fill="currentColor" opacity="0.2" />
      <circle cx="40" cy="34" r="3" fill="currentColor" opacity="0.35" />
      <circle cx="52" cy="34" r="3" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

export function SettingsIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 80 80" fill="none" className={className}>
      <circle cx="40" cy="40" r="10" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M40 8v8M40 64v8M14.4 20l6.8 4M58.8 56l6.8 4M8 40h8M64 40h8M14.4 60l6.8-4M58.8 24l6.8-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function DashboardIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 80 80" fill="none" className={className}>
      <rect x="6" y="6" width="30" height="30" rx="6" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <rect x="44" y="6" width="30" height="14" rx="4" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <rect x="44" y="24" width="30" height="12" rx="4" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <rect x="6" y="44" width="68" height="30" rx="6" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M16 60l10-12 12 8 18-20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BillingIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 80 80" fill="none" className={className}>
      <rect x="8" y="14" width="64" height="52" rx="8" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <rect x="14" y="20" width="52" height="12" rx="3" fill="currentColor" opacity="0.1" />
      <line x1="20" y1="26" x2="36" y2="26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="20" y1="38" x2="48" y2="38" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="20" y1="46" x2="44" y2="46" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="20" y1="54" x2="28" y2="54" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="58" cy="50" r="14" fill="currentColor" opacity="0.12" />
      <path d="M54 50l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
    </svg>
  );
}

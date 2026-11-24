// أيقونات SVG بسيطة. كلها aria-hidden لأن النص جنبها يشرح.
const base = { fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }

// سهم الرجوع يأشر لليمين (RTL).
export const BackIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" {...base}>
    <path d="M5 12h14" />
    <path d="m13 6 6 6-6 6" />
  </svg>
)

export const LockIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" strokeWidth="2" {...base}>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
)

export const CheckIcon = ({ size = 16, width = 2.5, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" strokeWidth={width} className={className} {...base}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

export const AlertIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" strokeWidth="2.2" {...base}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v5" />
    <path d="M12 16h.01" />
  </svg>
)

export const UploadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" strokeWidth="2.2" {...base}>
    <path d="M12 16V4" />
    <path d="m7 9 5-5 5 5" />
    <path d="M4 20h16" />
  </svg>
)

export const WifiOffIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" strokeWidth="2.2" {...base}>
    <path d="M2 8.8a15 15 0 0 1 4.2-2.6" />
    <path d="M22 8.8A15 15 0 0 0 11 5" />
    <path d="M5 12.6a10 10 0 0 1 3.5-2" />
    <path d="M19 12.6a10 10 0 0 0-2.4-1.6" />
    <path d="M8.5 16.4a5 5 0 0 1 7 0" />
    <path d="M12 20h.01" />
    <path d="m2 2 20 20" />
  </svg>
)

export const ChevronDownIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" strokeWidth="2" {...base}>
    <path d="m6 9 6 6 6-6" />
  </svg>
)

// دائرة التحميل تدور مع عقارب الساعة (ما تنعكس).
export const Spinner = ({ size = 20 }) => (
  <svg className="spin" width={size} height={size} viewBox="0 0 24 24" strokeWidth="2.5" fill="none" stroke="var(--color-accent)" strokeLinecap="round" aria-hidden="true">
    <path d="M21 12a9 9 0 1 1-9-9" />
  </svg>
)

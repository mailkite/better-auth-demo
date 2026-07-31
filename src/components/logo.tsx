/**
 * MailKite mark + wordmark.
 *
 * Inline SVG rather than an <img src="/logo.svg"> because the template inverts its
 * logo in dark mode (`dark:invert`), which would turn the brand blues orange. Here
 * the kite keeps its colours and only the wordmark follows `currentColor`.
 */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg
        viewBox="0 0 64 64"
        className="size-6 shrink-0"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M32 6 L32 46 L13 23 Z" fill="#5b9bff" />
        <path d="M32 6 L51 23 L32 46 Z" fill="#7c6cff" />
        <path
          d="M32 46 C 35 52 41 53 45 58"
          stroke="#5b9bff"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="45" cy="58" r="3" fill="#5b9bff" />
      </svg>
      <span className="text-[15px] font-semibold tracking-tight">MailKite</span>
    </span>
  );
}

export default Logo;

export function Logo({ className = "" }: { className?: string }) {
  // Geometric "atom / orbit" mark for a science center, with an embedded
  // beam suggesting projection. Monochrome, scales from 24px to 200px.
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-label="澳門科學館 EED"
      data-testid="img-logo"
    >
      <circle cx="24" cy="24" r="4" fill="currentColor" stroke="none" />
      <ellipse cx="24" cy="24" rx="20" ry="8" />
      <ellipse cx="24" cy="24" rx="20" ry="8" transform="rotate(60 24 24)" />
      <ellipse cx="24" cy="24" rx="20" ry="8" transform="rotate(120 24 24)" />
    </svg>
  );
}

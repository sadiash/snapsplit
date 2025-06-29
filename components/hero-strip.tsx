interface HeroStripProps {
  title: string;
  subtitle?: string;
}

export function HeroStrip({ title, subtitle }: HeroStripProps) {
  return (
    <div className="h-40 bg-gradient-to-r from-accent-mustard-500 to-accent-teal-500 relative overflow-hidden">
      <div className="absolute inset-0 bg-black/10"></div>
      {/* Receipt line-art on left */}
      <div className="absolute left-4 top-4 opacity-30">
        <svg width="60" height="80" viewBox="0 0 60 80" fill="none">
          <rect x="4" y="4" width="52" height="72" rx="2" stroke="white" strokeWidth="2" strokeDasharray="4 4"/>
          <line x1="12" y1="16" x2="48" y2="16" stroke="white" strokeWidth="1"/>
          <line x1="12" y1="24" x2="48" y2="24" stroke="white" strokeWidth="1"/>
          <line x1="12" y1="32" x2="40" y2="32" stroke="white" strokeWidth="1"/>
          <line x1="12" y1="40" x2="36" y2="40" stroke="white" strokeWidth="1"/>
          <line x1="12" y1="56" x2="48" y2="56" stroke="white" strokeWidth="2"/>
        </svg>
      </div>
      
      {/* Abstract people on right */}
      <div className="absolute right-4 top-4 opacity-30">
        <svg width="80" height="60" viewBox="0 0 80 60" fill="none">
          <circle cx="20" cy="20" r="8" fill="white"/>
          <circle cx="40" cy="15" r="6" fill="white"/>
          <circle cx="60" cy="25" r="7" fill="white"/>
          <path d="M12 35 Q20 30 28 35 L28 45 L12 45 Z" fill="white"/>
          <path d="M32 30 Q40 25 48 30 L48 40 L32 40 Z" fill="white"/>
          <path d="M52 40 Q60 35 68 40 L68 50 L52 50 Z" fill="white"/>
        </svg>
      </div>
      
      <div className="relative z-10 flex flex-col justify-center items-center h-full text-center px-4">
        <h1 className="text-2xl font-semibold tracking-tight text-white mb-2">{title}</h1>
        {subtitle && (
          <p className="text-white/90 text-sm max-w-xs">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
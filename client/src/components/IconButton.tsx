import { X } from 'lucide-react';
import { useState } from 'react';

interface IconButtonProps {
  href: string;
  ariaLabel?: string;
}

export default function IconButton({ href, ariaLabel = 'Close' }: IconButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(false);

  const handleClick = () => {
    console.log('Icon button clicked, navigating to:', href);
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={() => setIsActive(true)}
      onMouseUp={() => setIsActive(false)}
      className="glass-button rounded-2xl w-14 h-14 flex items-center justify-center transition-all duration-400 ease-out animate-pulse-subtle"
      style={{
        boxShadow: isHovered
          ? '0 8px 32px rgba(0,0,0,0.4), 0 0 20px rgba(255,255,255,0.3)'
          : '0 8px 32px rgba(0,0,0,0.4)',
        transform: isActive
          ? 'scale(0.95) rotate(90deg)'
          : isHovered
          ? 'scale(1.1) rotate(90deg)'
          : 'scale(1) rotate(0deg)',
      }}
      aria-label={ariaLabel}
      data-testid="icon-button"
    >
      <X className="w-6 h-6 text-white" strokeWidth={2} />
    </a>
  );
}

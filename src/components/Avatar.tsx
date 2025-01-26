import { User2 } from 'lucide-react';

interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16'
};

export function Avatar({ src, alt, size = 'md', className = '' }: AvatarProps) {
  const sizeClass = sizeClasses[size];
  
  if (!src) {
    return (
      <div className={`${sizeClass} rounded-full bg-gray-200 flex items-center justify-center ${className}`}>
        <User2 className={size === 'sm' ? 'w-4 h-4' : 'w-6 h-6'} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`${sizeClass} rounded-full object-cover ${className}`}
    />
  );
}

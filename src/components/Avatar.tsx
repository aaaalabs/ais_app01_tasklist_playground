import { User2 } from 'lucide-react';

interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: number;
  className?: string;
}

export function Avatar({ src, alt, size = 32, className = '' }: AvatarProps) {
  const showPlaceholder = !src;

  return (
    <div 
      className={`relative rounded-full overflow-hidden flex items-center justify-center bg-gray-100 ${className}`}
      style={{ width: size, height: size }}
    >
      {showPlaceholder ? (
        <User2 
          className="text-gray-400" 
          size={Math.round(size * 0.6)} 
        />
      ) : (
        <img
          src={src || ''}
          alt={alt}
          className="w-full h-full object-cover"
        />
      )}
    </div>
  );
}

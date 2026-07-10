import React from 'react';

// System theme colors from tailwind.config (primary, secondary, success, info, warning)
const COLORS = [
  'bg-primary',
  'bg-secondary',
  'bg-success',
  'bg-info',
  'bg-warning',
  'bg-primary/90',
  'bg-secondary/90',
  'bg-success/90',
];

function getInitials(fullname: string): string {
  if (!fullname || typeof fullname !== 'string') return '?';
  const parts = fullname.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return fullname.slice(0, 2).toUpperCase();
}

function colorFromName(name: string): string {
  let n = 0;
  for (let i = 0; i < (name || '').length; i++) n += name.charCodeAt(i);
  return COLORS[n % COLORS.length];
}

interface UserAvatarProps {
  fullname: string;
  profilePic?: string | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = { sm: 'w-8 h-8 text-xs', md: 'w-12 h-12 text-sm', lg: 'w-20 h-20 text-xl' };

export const UserAvatar: React.FC<UserAvatarProps> = ({ fullname, profilePic, className = '', size = 'lg' }) => {
  const initials = getInitials(fullname || '');
  const bgClass = colorFromName(fullname || 'u');

  if (profilePic) {
    return (
      <img
        src={profilePic}
        alt={fullname}
        className={`rounded-full object-cover ${sizeClasses[size]} ${className}`}
      />
    );
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center text-white font-semibold ${sizeClasses[size]} ${bgClass} ${className}`}
      title={fullname}
    >
      {initials}
    </div>
  );
};

export default UserAvatar;

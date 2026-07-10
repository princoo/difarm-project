import React from 'react';

const COLORS = [
  'bg-primary',
  'bg-secondary',
  'bg-success',
  'bg-info',
  'bg-warning',
  'bg-primary/90',
];

function getInitials(tagNumber?: string, breed?: string): string {
  if (tagNumber) {
    const cleaned = tagNumber.replace(/[^a-zA-Z0-9]/g, '');
    if (cleaned.length >= 2) return cleaned.slice(0, 2).toUpperCase();
    if (cleaned.length === 1) return cleaned.toUpperCase();
  }
  if (breed) return breed.slice(0, 2).toUpperCase();
  return '?';
}

function colorFromText(text: string): string {
  let n = 0;
  for (let i = 0; i < text.length; i++) n += text.charCodeAt(i);
  return COLORS[n % COLORS.length];
}

interface CattleAvatarProps {
  tagNumber?: string;
  breed?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'profile';
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-12 h-12 text-sm',
  lg: 'w-16 h-16 text-lg',
  xl: 'w-24 h-24 text-2xl',
  profile: 'w-28 h-28 text-3xl',
};

export default function CattleAvatar({
  tagNumber,
  breed,
  className = '',
  size = 'md',
}: CattleAvatarProps) {
  const label = tagNumber || breed || 'cattle';
  const initials = getInitials(tagNumber, breed);
  const bgClass = colorFromText(label);

  return (
    <div
      className={`rounded-full flex items-center justify-center text-white font-semibold ${sizeClasses[size]} ${bgClass} ${className}`}
      title={tagNumber}
    >
      {initials}
    </div>
  );
}

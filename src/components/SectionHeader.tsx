import React from 'react';

export interface SectionHeaderProps {
  tag?: string;
  title?: string;
  subtitle?: string;
  tagStyle?: React.CSSProperties;
  titleStyle?: React.CSSProperties;
  subtitleStyle?: React.CSSProperties;
  align?: 'center' | 'left' | 'right';
  className?: string;
  theme?: 'light' | 'dark';
  showLine?: boolean;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  tag,
  title,
  subtitle,
  tagStyle,
  titleStyle,
  subtitleStyle,
  align = 'center',
  className = '',
  theme = 'light',
  showLine = true,
}) => {
  const hasTag = typeof tag === 'string' && tag.trim().length > 0;
  const hasTitle = typeof title === 'string' && title.trim().length > 0;
  const hasSubtitle = typeof subtitle === 'string' && subtitle.trim().length > 0;

  if (!hasTag && !hasTitle && !hasSubtitle) return null;

  const alignClass = 
    align === 'left' ? 'text-left items-start' : 
    align === 'right' ? 'text-right items-end' : 
    'text-center items-center';

  return (
    <div className={`flex flex-col space-y-2 select-none ${alignClass} ${className}`}>
      {hasTag && (
        <span 
          style={tagStyle}
          className={`text-[10px] md:text-xs font-bold tracking-widest uppercase block font-sans ${
            theme === 'dark' ? 'text-gold-400' : 'text-gold-600'
          }`}
        >
          {tag}
        </span>
      )}
      {hasTitle && (
        <h2 
          style={titleStyle}
          className={`font-serif text-2xl md:text-3xl font-bold tracking-wide leading-tight ${
            theme === 'dark' ? 'text-white' : 'text-stone-900'
          }`}
        >
          {title}
        </h2>
      )}
      {hasSubtitle && (
        <p 
          style={subtitleStyle}
          className={`text-xs max-w-xl font-medium leading-relaxed ${
            theme === 'dark' ? 'text-stone-400' : 'text-stone-500'
          }`}
        >
          {subtitle}
        </p>
      )}
      {showLine && (hasTitle || hasTag) && (
        <div className={`h-0.5 w-12 mt-4 ${
          theme === 'dark' ? 'bg-gold-400' : 'bg-gold-500'
        } ${align === 'center' ? 'mx-auto' : align === 'right' ? 'ml-auto' : ''}`} />
      )}
    </div>
  );
};

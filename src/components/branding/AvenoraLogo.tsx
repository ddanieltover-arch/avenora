/**
 * @license Apache-2.0
 * Avenora — brand mark (served from /public)
 */

import React from 'react';

export const AVENORA_LOGO_SRC = '/avenora-logo.png';
export const AVENORA_HEADER_LOGO_SRC = '/avenora-header-logo.jpg';
export const AVENORA_OG_IMAGE_SRC = '/og-image.png';
export const AVENORA_FAVICON_SRC = '/favicon.png';

const SIZE_CLASS: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl', string> = {
  xs: 'h-6 w-6',
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
};

export interface AvenoraLogoProps {
  size?: keyof typeof SIZE_CLASS;
  className?: string;
  alt?: string;
}

export const AvenoraLogo: React.FC<AvenoraLogoProps> = ({
  size = 'md',
  className = '',
  alt = 'Avenora',
}) => (
  <img
    src={AVENORA_LOGO_SRC}
    alt={alt}
    className={`object-contain shrink-0 ${SIZE_CLASS[size]} ${className}`.trim()}
    decoding="async"
    draggable={false}
  />
);

/** Gradient tile mark for the public site header */
export const AvenoraHeaderLogo: React.FC<{ className?: string; alt?: string }> = ({
  className = '',
  alt = 'Avenora',
}) => (
  <img
    src={AVENORA_HEADER_LOGO_SRC}
    alt={alt}
    className={`h-10 w-10 sm:h-11 sm:w-11 object-cover shrink-0 rounded-xl shadow-sm ring-1 ring-brand-primary/20 ${className}`.trim()}
    decoding="async"
    draggable={false}
  />
);

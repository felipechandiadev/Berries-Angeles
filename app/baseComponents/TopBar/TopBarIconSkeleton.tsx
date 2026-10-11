'use client';

import React from 'react';
import { CircleUser, Printer } from 'lucide-react';

type TopBarIconSkeletonKind = 'printer' | 'user';

const ICONS = {
  printer: Printer,
  user: CircleUser,
} as const;

/**
 * Same chrome as TopBar icon buttons: circular bg + the real icon in light gray.
 */
export function TopBarIconSkeleton({
  kind,
  className = '',
  testId,
}: {
  kind: TopBarIconSkeletonKind;
  className?: string;
  testId?: string;
}) {
  const Icon = ICONS[kind];
  return (
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary/10 ${className}`}
      data-test-id={testId}
      aria-hidden
    >
      <Icon size={22} className="animate-pulse text-muted-foreground" aria-hidden />
    </div>
  );
}

/** Simple rounded square while the TopBar logo image loads. */
export function TopBarLogoSkeleton({
  className = '',
}: {
  className?: string;
}) {
  return (
    <div
      className={`h-8 w-8 shrink-0 rounded-lg bg-neutral-200 animate-pulse ${className}`}
      data-test-id="top-bar-logo-skeleton"
      aria-hidden
    />
  );
}

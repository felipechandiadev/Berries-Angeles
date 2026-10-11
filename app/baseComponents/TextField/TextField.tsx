"use client";

import React from "react";
import { TextField as KaiTextField } from "@felipechandiadev/ui";
import * as LucideIcons from "lucide-react";

/** Material Symbols → Lucide (compat mientras migran call-sites). */
const MATERIAL_TO_LUCIDE: Record<string, keyof typeof LucideIcons> = {
  search: "Search",
  person: "User",
  mail: "Mail",
  email: "Mail",
  lock: "Lock",
  visibility: "Eye",
  visibility_off: "EyeOff",
  calendar_today: "Calendar",
  calendar_month: "Calendar",
  attach_money: "DollarSign",
  phone: "Phone",
  close: "X",
  add: "Plus",
  edit: "Pencil",
  delete: "Trash2",
};

type KaiTextFieldProps = React.ComponentProps<typeof KaiTextField>;

export type TextFieldProps = KaiTextFieldProps & {
  /** @deprecated Prefer `startAdornment` / Lucide. Material icon name still accepted. */
  startIcon?: string;
  /** @deprecated Prefer `endAdornment` / Lucide. */
  endIcon?: string;
};

function resolveAdornment(
  iconName: string | undefined,
  existing: React.ReactNode | undefined,
): React.ReactNode | undefined {
  if (existing != null) return existing;
  if (!iconName) return undefined;
  const lucideName = MATERIAL_TO_LUCIDE[iconName] ?? (iconName as keyof typeof LucideIcons);
  const Icon = LucideIcons[lucideName] as React.ComponentType<{ size?: number; className?: string }> | undefined;
  if (!Icon || typeof Icon !== "function") return undefined;
  return <Icon size={18} className="text-secondary" aria-hidden />;
}

export const TextField: React.FC<TextFieldProps> = ({
  startIcon,
  endIcon,
  startAdornment,
  endAdornment,
  ...props
}) => {
  return (
    <KaiTextField
      {...props}
      startAdornment={resolveAdornment(startIcon, startAdornment)}
      endAdornment={resolveAdornment(endIcon, endAdornment)}
    />
  );
};

export default TextField;

"use client";

import React from "react";
import IconButtonKai from "@felipechandiadev/ui/components/IconButton/IconButton.js";
import type { ComponentProps } from "react";

type KaiProps = ComponentProps<typeof IconButtonKai>;
type LucideIconName = KaiProps["icon"];

/** Material Symbols → Lucide (compat call-sites Berries). */
const MATERIAL_TO_LUCIDE: Record<string, LucideIconName> = {
  add: "Plus",
  close: "X",
  delete: "Trash2",
  edit: "Pencil",
  search: "Search",
  settings: "Settings",
  menu: "Menu",
  print: "Printer",
  hourglass_top: "Loader2",
  receipt_long: "FileText",
  more_horiz: "Ellipsis",
  first_page: "ChevronsLeft",
  last_page: "ChevronsRight",
  chevron_left: "ChevronLeft",
  chevron_right: "ChevronRight",
  sort: "ArrowUpDown",
  file_download: "Download",
  refresh: "RefreshCw",
  arrow_upward: "ArrowUp",
  arrow_downward: "ArrowDown",
  checkbook: "NotebookPen",
  visibility: "Eye",
  visibility_off: "EyeOff",
  account_circle: "CircleUser",
  person: "User",
  inventory_2: "Package",
  agriculture: "Sprout",
  package_2: "Package",
  payments: "Wallet",
  group: "Users",
  key: "Key",
};

export type IconButtonProps = Omit<KaiProps, "icon"> & {
  icon: string | LucideIconName;
  /** Alias legacy Berries (`aria-label`). */
  "aria-label"?: string;
};

function resolveIcon(icon: string | LucideIconName): LucideIconName {
  if (typeof icon !== "string") return icon;
  if (MATERIAL_TO_LUCIDE[icon]) return MATERIAL_TO_LUCIDE[icon];
  // Already a Lucide name (PascalCase)
  if (/^[A-Z]/.test(icon)) return icon as LucideIconName;
  return "CircleHelp";
}

const IconButton: React.FC<IconButtonProps> = ({
  icon,
  ariaLabel,
  "aria-label": ariaLabelAttr,
  ...props
}) => {
  return (
    <IconButtonKai
      {...props}
      icon={resolveIcon(icon)}
      ariaLabel={ariaLabel ?? ariaLabelAttr}
    />
  );
};

export default IconButton;

import React from "react";
import * as Lucide from "lucide-react";
import { type ButtonVariant } from "../Button/Button";
import "./cards.css";
export type LucideIconName = keyof typeof Lucide;
export type CardTextAction = {
    id?: string;
    label: React.ReactNode;
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
    variant?: ButtonVariant;
    type?: "button" | "submit";
    disabled?: boolean;
    "data-test-id"?: string;
};
export type CardIconAction = {
    id?: string;
    icon: LucideIconName;
    ariaLabel: string;
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
    disabled?: boolean;
    "data-test-id"?: string;
};
export type CardAction = CardTextAction | CardIconAction;
export type CardProps = {
    className?: string;
    onClick?: () => void;
    "data-test-id"?: string;
    media?: React.ReactNode;
    title?: React.ReactNode;
    subtitle?: React.ReactNode;
    headerEnd?: React.ReactNode;
    content?: React.ReactNode;
    children?: React.ReactNode;
    actions?: CardAction[];
    actionsVariant?: "default" | "embedded";
    fillHeight?: boolean;
};
export declare function Card({ className, onClick, "data-test-id": dataTestId, media, title, subtitle, headerEnd, content, children, actions, actionsVariant, fillHeight, }: CardProps): React.JSX.Element;
//# sourceMappingURL=Card.d.ts.map
export type TouchInputMode = "none" | "text" | "tel" | "url" | "email" | "numeric" | "decimal" | "search";
export type ResolveTouchInputModeParams = {
    type: string;
    inputMode?: TouchInputMode;
    isCoarsePointer: boolean;
    allowDecimalComma?: boolean;
    allowLetters?: boolean;
    step?: number | string;
};
export declare function resolveTouchInputMode({ type, inputMode, isCoarsePointer, allowDecimalComma, allowLetters, step, }: ResolveTouchInputModeParams): TouchInputMode | undefined;
/** En touch, `type="number"` nativo muestra spinners raros; preferir text + inputMode. */
export declare function shouldUseTextInputForNumericType(type: string, isCoarsePointer: boolean, selectOnFocusForNumber: boolean): boolean;
//# sourceMappingURL=resolve-touch-input-mode.d.ts.map
import React from "react";
export type LinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    href: string;
};
export declare function Link({ href, onClick, children, ...rest }: LinkProps): React.JSX.Element;
export default Link;
//# sourceMappingURL=Link.d.ts.map
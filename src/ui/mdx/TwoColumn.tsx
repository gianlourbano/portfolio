import React from "react";

/**
 * TwoColumn layout for MDX.
 *
 * Primary use: place explanatory prose at left and a figure / code / callout at right.
 * Stacks vertically below the given breakpoint.
 *
 * Basic usage (MDX):
 * <TwoColumn ratio="2:1" gap={20} collapseAt={820} align="top">
 *   <TwoColumn.Left>
 *     <p>Left side content (text, lists, code blocks, etc.)</p>
 *   </TwoColumn.Left>
 *   <TwoColumn.Right>
 *     <Figure src="/img/example.png" caption="Example" />
 *   </TwoColumn.Right>
 * </TwoColumn>
 *
 * Allowed props:
 * - ratio       string   e.g. "1:1", "2:1", "1:2" (determines relative flex-grow) (default 1:1)
 * - gap         number|string  spacing between columns (default 16)
 * - collapseAt  number   viewport width (px) below which layout becomes vertical (default 760)
 * - align       "top" | "center" | "stretch"  vertical alignment when side‑by‑side (default "top")
 *
 * Notes:
 * - Children must be wrapped with <TwoColumn.Left> and <TwoColumn.Right> for clarity, but these are
 *   simple passthrough wrappers—you can nest anything inside (headings, lists, Tabs, Callouts, etc.).
 * - Extra children beyond two are still rendered; only first is treated as left, second as right; others get default flex.
 * - The component uses a lightweight flexbox approach with a JS matchMedia listener (not ResizeObserver)
 *   to avoid SSR mismatches and keep behavior explicit.
 * - If you need a full-width element on mobile only, place it inside one side and add responsive CSS in MDX.
 */
export interface TwoColumnProps {
    ratio?: string; // e.g. "1:1", "2:1"
    gap?: number | string;
    collapseAt?: number; // px width to stack
    align?: "top" | "center" | "stretch";
    children: React.ReactNode;
    style?: React.CSSProperties;
}

const parseRatio = (ratio?: string): [number, number] => {
    if (!ratio) return [1, 1];
    const m = ratio.split(":").map((v) => parseFloat(v.trim()));
    if (m.length === 2 && m.every((n) => !Number.isNaN(n) && n > 0)) {
        return [m[0], m[1]];
    }
    return [1, 1];
};

function Container({
    ratio = "1:1",
    gap = 16,
    collapseAt = 760,
    align = "top",
    children,
    style,
}: TwoColumnProps) {
    const [a, b] = parseRatio(ratio);
    const gapValue = typeof gap === "number" ? `${gap}px` : gap;
    const wrapRef = React.useRef<HTMLDivElement | null>(null);
    const [wide, setWide] = React.useState<boolean>(true);

    React.useEffect(() => {
        const el = wrapRef.current;
        if (!el) return;
        const mql = window.matchMedia(`(max-width: ${collapseAt - 1}px)`);
        const update = () => setWide(!mql.matches);
        update();
        mql.addEventListener("change", update);
        return () => mql.removeEventListener("change", update);
    }, [collapseAt]);

    const alignItems =
        align === "center"
            ? "center"
            : align === "stretch"
            ? "stretch"
            : "flex-start";

    const childrenArr = React.Children.toArray(children);
    return (
        <div
            ref={wrapRef}
            style={{
                display: "flex",
                flexDirection: wide ? "row" : "column",
                gap: gapValue,
                alignItems,
                ...style,
            }}
        >
            {childrenArr.map((child, idx) => {
                if (!React.isValidElement(child)) return child;
                const flexGrow = idx === 0 ? a : b;
                return (
                    <div
                        key={idx}
                        style={{
                            flex: wide ? `${flexGrow} 1 0` : "unset",
                            minWidth: 0,
                        }}
                    >
                        {child}
                    </div>
                );
            })}
        </div>
    );
}

// Simple wrappers to make semantic MDX usage explicit
function Left({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
function Right({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}

export const TwoColumn = Object.assign(Container, { Left, Right });

export default TwoColumn;

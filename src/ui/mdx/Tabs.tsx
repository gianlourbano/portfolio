import React, { useMemo, useState } from "react";

export function Tabs({
    children,
    defaultId,
}: {
    children: React.ReactNode;
    defaultId?: string;
}) {
    const items = useMemo(() => {
        const arr = React.Children.toArray(children) as React.ReactElement[];
        return arr
            .map((el) => {
                const props: any = el.props || {};
                if (!props || !props.id) return null;
                return {
                    id: props.id as string,
                    label: props.label as string,
                    el,
                };
            })
            .filter(Boolean) as {
            id: string;
            label: string;
            el: React.ReactElement;
        }[];
    }, [children]);
    const [active, setActive] = useState<string>(
        () => defaultId || (items[0]?.id ?? "")
    );
    const current = items.find((i) => i.id === active) || items[0];
    return (
        <div style={{ display: "grid", gap: 6 }}>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {items.map((it) => (
                    <button
                        key={it.id}
                        onClick={() => setActive(it.id)}
                        style={{
                            appearance: "none",
                            cursor: "pointer",
                            padding: "2px 8px",
                            background: "#c0c0c0",
                            border: "2px solid #fff",
                            borderBottomColor: "#404040",
                            borderRightColor: "#404040",
                            fontWeight: 600,
                            ...(active === it.id
                                ? {
                                      borderTopColor: "#404040",
                                      borderLeftColor: "#404040",
                                      borderBottomColor: "#fff",
                                      borderRightColor: "#fff",
                                  }
                                : {}),
                        }}
                        title={it.label}
                    >
                        {it.label}
                    </button>
                ))}
            </div>
            <div
                style={{
                    background: "#c0c0c0",
                    border: "2px solid #fff",
                    borderBottomColor: "#404040",
                    borderRightColor: "#404040",
                    padding: 8,
                }}
            >
                {current?.el}
            </div>
        </div>
    );
}

export function Tab({
    children,
}: {
    id: string;
    label: string;
    children: React.ReactNode;
}) {
    return <>{children}</>;
}

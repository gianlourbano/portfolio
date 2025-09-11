import { useRef, useState } from "react";
import { React95Icon } from "./React95Icons";

export function Window({
    title,
    initial,
    children,
    onClose,
    zIndex = 1,
    onActivate,
    iconName,
    isMaximized = false,
    onMinimize,
    onToggleMaximize,
    onBoundsChange,
}: {
    title: string;
    initial: { x: number; y: number; w?: number; h?: number };
    children: React.ReactNode;
    onClose?: () => void;
    zIndex?: number;
    onActivate?: () => void;
    iconName?: string;
    isMaximized?: boolean;
    onMinimize?: () => void;
    onToggleMaximize?: () => void;
    onBoundsChange?: (b: {
        x: number;
        y: number;
        w: number;
        h: number;
    }) => void;
}) {
    const TASKBAR_H = 40;
    const [pos, setPos] = useState({ x: initial.x, y: initial.y });
    const [size, setSize] = useState({
        w: initial.w ?? 480,
        h: initial.h ?? 300,
    });
    const winRef = useRef<HTMLDivElement | null>(null);
    const dragOffset = useRef<{ x: number; y: number } | null>(null);
    const resizing = useRef<{ x: number; y: number } | null>(null);
    const lastDragPos = useRef<{ x: number; y: number } | null>(null);
    const lastResize = useRef<{ w: number; h: number } | null>(null);
    const didResizeRef = useRef(false);

    const clamp = (val: number, min: number, max: number) =>
        Math.max(min, Math.min(max, val));

    const onMouseDown: React.MouseEventHandler = (e) => {
        // Ignore drags that start on the window controls area
        if ((e.target as HTMLElement)?.closest(".win-controls")) return;
        onActivate?.();
        if (isMaximized) return;
        const winEl = (e.currentTarget as HTMLElement).closest(
            ".window"
        ) as HTMLElement | null;
        if (!winEl) return;
        const rect = winEl.getBoundingClientRect();
        dragOffset.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
        // new drag session
        lastDragPos.current = null;
        didResizeRef.current = false;
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
    };
    const onMouseMove = (e: MouseEvent) => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        if (resizing.current && !isMaximized) {
            const dx = e.clientX - resizing.current.x;
            const dy = e.clientY - resizing.current.y;
            const minW = 260;
            const minH = 160;
            const maxW = Math.max(minW, vw - pos.x);
            const maxH = Math.max(minH, vh - TASKBAR_H - pos.y);
            const nextW = clamp(
                (lastResize.current?.w ?? size.w) + dx,
                minW,
                maxW
            );
            const nextH = clamp(
                (lastResize.current?.h ?? size.h) + dy,
                minH,
                maxH
            );
            // Apply imperatively for smoothness
            if (winRef.current) {
                winRef.current.style.width = `${nextW}px`;
                winRef.current.style.height = `${nextH}px`;
            }
            lastResize.current = { w: nextW, h: nextH };
            didResizeRef.current = true;
            // accumulate
            resizing.current = { x: e.clientX, y: e.clientY };
            return;
        }
        if (dragOffset.current && !isMaximized) {
            const x = clamp(
                e.clientX - dragOffset.current.x,
                0,
                Math.max(0, vw - size.w)
            );
            const y = clamp(
                e.clientY - dragOffset.current.y,
                0,
                Math.max(0, vh - TASKBAR_H - size.h)
            );
            // Apply transform imperatively to avoid re-rendering heavy children on every frame
            if (winRef.current) {
                winRef.current.style.transform = `translate(${x}px, ${y}px)`;
            }
            lastDragPos.current = { x, y };
        }
    };
    const onMouseUp = () => {
        dragOffset.current = null;
        resizing.current = null;
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const finalX = lastDragPos.current ? lastDragPos.current.x : pos.x;
        const finalY = lastDragPos.current ? lastDragPos.current.y : pos.y;
        const didResize = didResizeRef.current;
        const finalW =
            didResize && lastResize.current ? lastResize.current.w : size.w;
        const finalH =
            didResize && lastResize.current ? lastResize.current.h : size.h;
        const clamped = {
            x: clamp(finalX, 0, Math.max(0, vw - finalW)),
            y: clamp(finalY, 0, Math.max(0, vh - TASKBAR_H - finalH)),
            w: Math.min(finalW, vw),
            h: Math.min(finalH, Math.max(0, vh - TASKBAR_H)),
        };
        // Commit to state once at the end
        setPos({ x: clamped.x, y: clamped.y });
        setSize({ w: clamped.w, h: clamped.h });
        // Clear imperative overrides
        if (winRef.current) {
            if (lastDragPos.current) {
                // Only clear transform if we actually dragged; otherwise we'd jump to (0,0)
                winRef.current.style.transform = "";
            }
            if (didResize) {
                // Only clear width/height if we had set them imperatively during a resize
                winRef.current.style.width = "";
                winRef.current.style.height = "";
            }
        }
        lastDragPos.current = null;
        lastResize.current = null;
        didResizeRef.current = false;
        onBoundsChange?.(clamped);
    };

    const onResizeMouseDown: React.MouseEventHandler = (e) => {
        onActivate?.();
        e.preventDefault();
        resizing.current = { x: e.clientX, y: e.clientY };
        // establish baseline for resize from current size
        lastResize.current = { w: size.w, h: size.h };
        didResizeRef.current = false;
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
        e.stopPropagation();
    };

    return (
        <div
            className="window"
            ref={winRef}
            onMouseDownCapture={() => onActivate?.()}
            style={{
                transform: isMaximized
                    ? `translate(0px, 0px)`
                    : `translate(${pos.x}px, ${pos.y}px)`,
                width: isMaximized ? "100%" : size.w,
                height: isMaximized ? "calc(100% - 40px)" : size.h,
                zIndex,
            }}
        >
            <div className="window-titlebar" onMouseDown={onMouseDown}>
                <div
                    className="title"
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                    {iconName ? (
                        <React95Icon name={iconName} size={20} />
                    ) : null}
                    <span>{title}</span>
                </div>
                <div
                    className="win-controls"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <button
                        type="button"
                        className="win-btn"
                        aria-label="Minimize"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={onMinimize}
                    >
                        _
                    </button>
                    <button
                        type="button"
                        className="win-btn"
                        aria-label={isMaximized ? "Restore" : "Maximize"}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={onToggleMaximize}
                    >
                        {isMaximized ? "❐" : "▢"}
                    </button>
                    <button
                        type="button"
                        className="win-btn close"
                        aria-label="Close"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={onClose}
                    >
                        X
                    </button>
                </div>
            </div>
            <div className="window-body">{children}</div>
            {!isMaximized && (
                <div
                    className="resize-handle"
                    onMouseDown={onResizeMouseDown}
                />
            )}
        </div>
    );
}

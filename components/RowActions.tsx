"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./RowActions.module.css";

export type RowAction = {
  label: string;
  onClick?: () => void;
  href?: string;
  tone?: "default" | "danger";
  disabled?: boolean;
  title?: string;
};

type MenuPos = { top: number; left: number };

/** Compact ⋮ menu for table row actions. */
export function RowActions({ actions }: { actions: RowAction[] }) {
  const visible = actions.filter(Boolean);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<MenuPos>({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;

    const place = () => {
      const btn = btnRef.current;
      if (!btn) return;
      const r = btn.getBoundingClientRect();
      const menuW = 168;
      const pad = 8;
      let left = r.right - menuW;
      if (left < pad) left = pad;
      if (left + menuW > window.innerWidth - pad) {
        left = window.innerWidth - menuW - pad;
      }
      let top = r.bottom + 6;
      const menuH = menuRef.current?.offsetHeight ?? 140;
      if (top + menuH > window.innerHeight - pad) {
        top = Math.max(pad, r.top - menuH - 6);
      }
      setPos({ top, left });
    };

    place();
    // Re-measure after paint for accurate height
    const t = requestAnimationFrame(place);

    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onScroll = () => setOpen(false);

    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);

    return () => {
      cancelAnimationFrame(t);
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open]);

  if (!visible.length) return null;

  const run = (a: RowAction) => {
    if (a.disabled) return;
    setOpen(false);
    a.onClick?.();
  };

  return (
    <div className={styles.wrap}>
      <button
        ref={btnRef}
        type="button"
        className={`${styles.trigger} ${open ? styles.triggerOpen : ""}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        title="Actions"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <span className={styles.dots} aria-hidden>
          ⋮
        </span>
      </button>

      {mounted &&
        open &&
        createPortal(
          <div
            ref={menuRef}
            id={menuId}
            role="menu"
            className={styles.menu}
            style={{ top: pos.top, left: pos.left }}
          >
            {visible.map((a, i) => {
              const className = `${styles.item} ${
                a.tone === "danger" ? styles.itemDanger : ""
              }`;
              if (a.href) {
                return (
                  <a
                    key={`${a.label}-${i}`}
                    role="menuitem"
                    href={a.href}
                    className={className}
                    title={a.title ?? a.label}
                    onClick={() => setOpen(false)}
                  >
                    {a.label}
                  </a>
                );
              }
              return (
                <button
                  key={`${a.label}-${i}`}
                  type="button"
                  role="menuitem"
                  className={className}
                  disabled={a.disabled}
                  title={a.title ?? a.label}
                  onClick={() => run(a)}
                >
                  {a.label}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </div>
  );
}

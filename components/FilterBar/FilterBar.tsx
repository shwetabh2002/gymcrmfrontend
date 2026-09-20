"use client";

import { ReactNode } from "react";
import styles from "./FilterBar.module.css";

type FilterBarProps = {
  title?: string;
  activeCount?: number;
  onClear?: () => void;
  children: ReactNode;
  chips?: ReactNode;
};

export function FilterBar({
  title = "Filters",
  activeCount = 0,
  onClear,
  children,
  chips,
}: FilterBarProps) {
  return (
    <div className={styles.bar}>
      <div className={styles.topRow}>
        <h2 className={styles.title}>
          <span className={styles.titleBar} />
          {title}
        </h2>
        <div className={styles.meta}>
          {activeCount > 0 ? (
            <span className={styles.activeCount}>
              {activeCount} active filter{activeCount === 1 ? "" : "s"}
            </span>
          ) : null}
          {onClear && activeCount > 0 ? (
            <button type="button" className={styles.clearBtn} onClick={onClear}>
              Clear all
            </button>
          ) : null}
        </div>
      </div>
      {chips ? <div className={styles.chips}>{chips}</div> : null}
      <div className={styles.grid}>{children}</div>
    </div>
  );
}

type FieldProps = {
  label: string;
  children: ReactNode;
  grow?: boolean;
};

export function FilterField({ label, children, grow }: FieldProps) {
  return (
    <label className={`${styles.field} ${grow ? styles.fieldGrow : ""}`}>
      <span className={styles.label}>{label}</span>
      {children}
    </label>
  );
}

export function FilterSearch({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className={styles.searchWrap}>
      <span className={styles.searchIcon}>⌕</span>
      <input
        className={styles.searchInput}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Search…"}
      />
    </div>
  );
}

export function FilterSelect({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: ReactNode;
}) {
  return (
    <select
      className={styles.select}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {children}
    </select>
  );
}

export function FilterInput({
  value,
  onChange,
  type = "text",
  placeholder,
  min,
  max,
}: {
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  min?: string | number;
  max?: string | number;
}) {
  return (
    <input
      className={styles.input}
      type={type}
      value={value}
      min={min}
      max={max}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`${styles.chip} ${active ? styles.chipOn : ""}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

export { styles as filterBarStyles };

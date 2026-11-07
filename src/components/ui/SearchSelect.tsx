"use client";

import {
  Children,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { createPortal } from "react-dom";

interface Opt {
  value: string;
  label: string;
}

type Props = Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange" | "value" | "children"> & {
  value: string | number | undefined;
  onChange?: (event: { target: { value: string } }) => void;
  children: ReactNode;
};

/** Lists with at least this many options get a search box; shorter ones stay a normal select. */
const SEARCH_FROM = 6;

function textOf(node: ReactNode): string {
  return Children.toArray(node)
    .map((n) => (typeof n === "string" || typeof n === "number" ? String(n) : ""))
    .join("");
}

function optionsOf(children: ReactNode): Opt[] {
  const out: Opt[] = [];
  for (const child of Children.toArray(children)) {
    if (!isValidElement(child) || child.type !== "option") continue;
    const props = child.props as { value?: string | number; children?: ReactNode };
    const label = textOf(props.children);
    out.push({ value: props.value !== undefined ? String(props.value) : label, label });
  }
  return out;
}

/**
 * Drop-in replacement for `<select>`: same props and `<option>` children, but
 * with many options it opens a list with a search box (type "a" to see Apple…).
 * It keeps the real `<select>` element for looks, so existing styles apply.
 */
export default function SearchSelect({ value, onChange, children, disabled, ...rest }: Props) {
  const options = useMemo(() => optionsOf(children), [children]);
  const current = String(value ?? "");
  const shownLabel = options.find((o) => o.value === current)?.label ?? "";
  const searchable = options.length >= SEARCH_FROM && !disabled;

  const selectRef = useRef<HTMLSelectElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [box, setBox] = useState({ left: 0, top: 0, width: 240, maxHeight: 320 });

  const needle = query.trim().toLowerCase();
  const filtered = needle ? options.filter((o) => o.label.toLowerCase().includes(needle) || o.value.toLowerCase().includes(needle)) : options;

  function openList() {
    const el = selectRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const below = window.innerHeight - r.bottom - 12;
    const above = r.top - 12;
    const goUp = below < 220 && above > below;
    const maxHeight = Math.max(160, Math.min(360, goUp ? above : below));
    setBox({
      left: Math.max(8, Math.min(r.left, window.innerWidth - Math.max(r.width, 240) - 8)),
      top: goUp ? Math.max(8, r.top - maxHeight - 4) : r.bottom + 4,
      width: Math.max(r.width, 240),
      maxHeight,
    });
    setQuery("");
    setActive(Math.max(0, options.findIndex((o) => o.value === current)));
    setOpen(true);
  }

  function pick(opt: Opt) {
    setOpen(false);
    onChange?.({ target: { value: opt.value } });
    selectRef.current?.focus();
  }

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (popRef.current?.contains(t) || selectRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onScroll = (e: Event) => {
      if (popRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("scroll", onScroll, true);
    const onResize = () => setOpen(false);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  useEffect(() => setActive(0), [query]);

  useEffect(() => {
    if (!open) return;
    popRef.current?.querySelector<HTMLElement>('[data-active="true"]')?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  function onListKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[active]) pick(filtered[active]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      selectRef.current?.focus();
    }
  }

  return (
    <>
      <select
        {...rest}
        ref={selectRef}
        disabled={disabled}
        value={current}
        onChange={(e) => onChange?.({ target: { value: e.target.value } })}
        onMouseDown={(e) => {
          if (!searchable) return;
          e.preventDefault();
          if (open) setOpen(false);
          else openList();
        }}
        onKeyDown={(e) => {
          if (!searchable) return;
          if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            openList();
          }
        }}
      >
        {searchable ? <option value={current}>{shownLabel}</option> : children}
      </select>
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={popRef}
            className="search-select-pop"
            style={{ left: box.left, top: box.top, width: box.width, maxHeight: box.maxHeight }}
            onKeyDown={onListKey}
          >
            <input
              autoFocus
              className="search-select-input"
              type="text"
              placeholder="Search…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search options"
            />
            <div className="search-select-list" role="listbox">
              {filtered.length === 0 ? (
                <div className="search-select-empty">No matches</div>
              ) : (
                filtered.map((o, i) => (
                  <button
                    type="button"
                    key={`${o.value}-${i}`}
                    role="option"
                    aria-selected={o.value === current}
                    data-active={i === active}
                    className={`search-select-option${o.value === current ? " selected" : ""}`}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => pick(o)}
                  >
                    {o.label || "—"}
                  </button>
                ))
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

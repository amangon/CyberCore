import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  KeyboardEvent,
} from "react";
import styles from "./ReportSearch.module.css";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SearchCategory = "reports" | "threats" | "cves" | "ioc";

export interface RecentSearch {
  id: string;
  query: string;
  category: SearchCategory;
  timestamp: Date;
}

export interface ReportSearchProps {
  /** Called with (query, category) after debounce */
  onSearch: (query: string, category: SearchCategory) => void;
  /** Persisted recent searches; manage externally */
  recentSearches?: RecentSearch[];
  onClearRecent?: () => void;
  onSelectRecent?: (item: RecentSearch) => void;
  /** Debounce delay in ms. Defaults to 350. */
  debounceMs?: number;
  placeholder?: string;
  /** Keyboard shortcut to focus the input. Defaults to "/" */
  shortcutKey?: string;
  className?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES: { value: SearchCategory; label: string; shortLabel: string }[] =
  [
    { value: "reports", label: "Reports", shortLabel: "Reports" },
    { value: "threats", label: "Threats", shortLabel: "Threats" },
    { value: "cves", label: "CVEs", shortLabel: "CVEs" },
    { value: "ioc", label: "IOC", shortLabel: "IOC" },
  ];

const CATEGORY_ICONS: Record<SearchCategory, React.ReactNode> = {
  reports: (
    <svg
      aria-hidden="true"
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="currentColor"
    >
      <path d="M4 1h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2zm0 1a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1H4zm1 3h6v1H5V5zm0 3h6v1H5V8zm0 3h4v1H5v-1z" />
    </svg>
  ),
  threats: (
    <svg
      aria-hidden="true"
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="currentColor"
    >
      <path d="M8 1l7 13H1L8 1zm0 2.3L2.5 13h11L8 3.3zM7.5 6h1v4h-1V6zm0 5h1v1h-1v-1z" />
    </svg>
  ),
  cves: (
    <svg
      aria-hidden="true"
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="currentColor"
    >
      <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm0 1.5a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13zM7.25 4.5v4.25l3.5 2.1.75-1.24-2.75-1.65V4.5h-1.5z" />
    </svg>
  ),
  ioc: (
    <svg
      aria-hidden="true"
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="currentColor"
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 1.85.63 3.55 1.68 4.91L.22 14.37l1.41 1.41 1.46-1.46A7.95 7.95 0 0 0 8 16c4.42 0 8-3.58 8-8s-3.58-8-8-8zm0 1.5a6.5 6.5 0 1 1 0 13A6.5 6.5 0 0 1 8 1.5zM5 5l6 6-1.06 1.06L4 6.06 5 5z" />
    </svg>
  ),
};

// ─── Hook: debounce ───────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ReportSearch: React.FC<ReportSearchProps> = ({
  onSearch,
  recentSearches = [],
  onClearRecent,
  onSelectRecent,
  debounceMs = 350,
  placeholder,
  shortcutKey = "/",
  className,
}) => {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<SearchCategory>("reports");
  const [isFocused, setIsFocused] = useState(false);
  const [activeRecentIdx, setActiveRecentIdx] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(query, debounceMs);

  // Fire search when debounced value or category changes
  useEffect(() => {
    if (debouncedQuery.trim()) {
      onSearch(debouncedQuery.trim(), category);
    }
  }, [debouncedQuery, category, onSearch]);

  // Global keyboard shortcut to focus input
  useEffect(() => {
    const handleGlobalKey = (e: globalThis.KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (
        e.key === shortcutKey &&
        tag !== "INPUT" &&
        tag !== "TEXTAREA" &&
        !e.metaKey &&
        !e.ctrlKey
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleGlobalKey);
    return () => document.removeEventListener("keydown", handleGlobalKey);
  }, [shortcutKey]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsFocused(false);
        setActiveRecentIdx(-1);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleClear = useCallback(() => {
    setQuery("");
    setActiveRecentIdx(-1);
    inputRef.current?.focus();
  }, []);

  const handleSelectRecent = useCallback(
    (item: RecentSearch) => {
      setQuery(item.query);
      setCategory(item.category);
      onSelectRecent?.(item);
      setIsFocused(false);
      setActiveRecentIdx(-1);
    },
    [onSelectRecent]
  );

  const showDropdown =
    isFocused && recentSearches.length > 0 && query.trim() === "";

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) {
      if (e.key === "Escape") handleClear();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveRecentIdx((i) => Math.min(i + 1, recentSearches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveRecentIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeRecentIdx >= 0) {
      e.preventDefault();
      handleSelectRecent(recentSearches[activeRecentIdx]);
    } else if (e.key === "Escape") {
      setIsFocused(false);
      setActiveRecentIdx(-1);
    }
  };

  const resolvedPlaceholder =
    placeholder ??
    `Search ${CATEGORIES.find((c) => c.value === category)?.label ?? ""}…`;

  const formatRelativeTime = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div
      className={[styles.root, className].filter(Boolean).join(" ")}
      ref={dropdownRef}
    >
      {/* ── Category tabs ── */}
      <div className={styles.tabs} role="tablist" aria-label="Search category">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            role="tab"
            aria-selected={category === cat.value}
            className={[
              styles.tab,
              category === cat.value ? styles.tabActive : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => setCategory(cat.value)}
          >
            <span className={styles.tabIcon}>{CATEGORY_ICONS[cat.value]}</span>
            <span className={styles.tabLabel}>{cat.label}</span>
            <span className={styles.tabLabelShort}>{cat.shortLabel}</span>
          </button>
        ))}
      </div>

      {/* ── Search bar ── */}
      <div
        className={[styles.bar, isFocused ? styles.barFocused : ""]
          .filter(Boolean)
          .join(" ")}
      >
        {/* Search icon */}
        <span className={styles.searchIcon} aria-hidden="true">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="6.5" cy="6.5" r="4.5" />
            <line x1="10.5" y1="10.5" x2="14" y2="14" />
          </svg>
        </span>

        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={showDropdown}
          aria-autocomplete="list"
          aria-controls="report-search-recent"
          aria-activedescendant={
            activeRecentIdx >= 0
              ? `recent-item-${activeRecentIdx}`
              : undefined
          }
          className={styles.input}
          value={query}
          placeholder={resolvedPlaceholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveRecentIdx(-1);
          }}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleInputKeyDown}
          autoComplete="off"
          spellCheck={false}
        />

        {/* Keyboard shortcut badge — only when empty and unfocused */}
        {!query && !isFocused && (
          <kbd className={styles.shortcutBadge} aria-label={`Press ${shortcutKey} to search`}>
            {shortcutKey}
          </kbd>
        )}

        {/* Clear button — only when there's a query */}
        {query && (
          <button
            className={styles.clearBtn}
            onClick={handleClear}
            aria-label="Clear search"
            tabIndex={0}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <line x1="2" y1="2" x2="12" y2="12" />
              <line x1="12" y1="2" x2="2" y2="12" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Recent searches dropdown ── */}
      {showDropdown && (
        <div
          id="report-search-recent"
          role="listbox"
          aria-label="Recent searches"
          className={styles.dropdown}
        >
          <div className={styles.dropdownHeader}>
            <span className={styles.dropdownTitle}>
              <svg
                aria-hidden="true"
                width="13"
                height="13"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 1.5a5.5 5.5 0 1 1 0 11A5.5 5.5 0 0 1 8 2.5zm-.75 2v4.25l3.5 2.1.75-1.24-2.75-1.65V4.5h-1.5z" />
              </svg>
              Recent searches
            </span>
            {onClearRecent && (
              <button
                className={styles.clearAllBtn}
                onClick={onClearRecent}
                aria-label="Clear all recent searches"
              >
                Clear all
              </button>
            )}
          </div>

          <ul className={styles.recentList}>
            {recentSearches.map((item, idx) => (
              <li
                key={item.id}
                id={`recent-item-${idx}`}
                role="option"
                aria-selected={activeRecentIdx === idx}
                className={[
                  styles.recentItem,
                  activeRecentIdx === idx ? styles.recentItemActive : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onMouseDown={(e) => {
                  // prevent blur before click registers
                  e.preventDefault();
                  handleSelectRecent(item);
                }}
                onMouseEnter={() => setActiveRecentIdx(idx)}
              >
                <span className={styles.recentIcon} aria-hidden="true">
                  {CATEGORY_ICONS[item.category]}
                </span>
                <span className={styles.recentQuery}>{item.query}</span>
                <span
                  className={[styles.recentCategory, styles[`cat_${item.category}`]]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {item.category.toUpperCase()}
                </span>
                <span className={styles.recentTime}>
                  {formatRelativeTime(item.timestamp)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ReportSearch;
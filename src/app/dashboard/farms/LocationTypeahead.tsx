import { useState, useRef, useEffect } from "react";

interface Option {
  id: string;
  name: string;
}

interface LocationTypeaheadProps {
  options: Option[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  "data-testid"?: string;
}

export function LocationTypeahead({
  options,
  value,
  onChange,
  placeholder = "Select...",
  disabled = false,
  className = "",
}: LocationTypeaheadProps) {
  const [open, setOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.id === value);
  const displayValue = selectedOption ? selectedOption.name : "";
  const searchText = (inputText || displayValue).trim().toLowerCase();
  const filtered =
    searchText === ""
      ? options
      : options.filter((o) => o.name.toLowerCase().includes(searchText));

  useEffect(() => {
    if (value && selectedOption) setInputText(selectedOption.name);
  }, [value, selectedOption?.name]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setInputText(selectedOption ? selectedOption.name : "");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedOption]);

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={open ? inputText : displayValue}
        onChange={(e) => {
          setInputText(e.target.value);
          setOpen(true);
          if (!e.target.value) onChange("");
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
        autoComplete="off"
      />
      {open && !disabled && (
        <ul
          className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-1 shadow-lg"
          role="listbox"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
              No match
            </li>
          ) : (
            filtered.map((opt) => (
              <li
                key={opt.id}
                role="option"
                aria-selected={opt.id === value}
                className={`cursor-pointer px-3 py-2 text-sm ${
                  opt.id === value
                    ? "bg-primary/10 text-primary"
                    : "text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(opt.id);
                  setInputText(opt.name);
                  setOpen(false);
                }}
              >
                {opt.name}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

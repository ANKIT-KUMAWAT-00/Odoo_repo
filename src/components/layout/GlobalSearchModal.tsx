"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Package, FileText, ArrowRightLeft, SlidersHorizontal, Loader2, X } from "lucide-react";

interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  type: "PRODUCT" | "RECEIPT" | "DELIVERY" | "TRANSFER" | "ADJUSTMENT";
  url: string;
  badge?: string;
}

export function GlobalSearchModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
          setSelectedIndex(0);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (url: string) => {
    onClose();
    router.push(url);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < results.length ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : results.length - 1));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex].url);
    }
  };

  if (!isOpen) return null;

  const grouped = {
    products: results.filter((r) => r.type === "PRODUCT"),
    receipts: results.filter((r) => r.type === "RECEIPT"),
    deliveries: results.filter((r) => r.type === "DELIVERY"),
    transfers: results.filter((r) => r.type === "TRANSFER"),
    adjustments: results.filter((r) => r.type === "ADJUSTMENT"),
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150"
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center px-4 border-b border-slate-200">
          <Search className="w-5 h-5 text-slate-400 mr-3 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, SKU, receipts (REC-), deliveries (DEL-), transfers (TRF-)..."
            className="w-full py-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent"
          />
          {isLoading && <Loader2 className="w-4 h-4 text-brand-600 animate-spin mr-2" />}
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
            aria-label="Close search"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-3 space-y-4">
          {!query.trim() && (
            <div className="p-8 text-center text-xs text-slate-400">
              Type to search by Product Name, SKU code, or Document number (e.g. REC-00001, DEL-00001, Steel)
            </div>
          )}

          {query.trim() && !isLoading && results.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-400">
              No matching products or documents found for &quot;{query}&quot;
            </div>
          )}

          {grouped.products.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
                Products
              </div>
              <div className="space-y-1 mt-1">
                {grouped.products.map((item, idx) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => handleSelect(item.url)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-colors ${
                      results[selectedIndex] === item ? "bg-brand-50 ring-1 ring-brand-200" : "hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-brand-50 text-brand-600">
                        <Package className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                        <div className="text-xs text-slate-500">{item.subtitle}</div>
                      </div>
                    </div>
                    {item.badge && (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {(grouped.receipts.length > 0 || grouped.deliveries.length > 0) && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
                Receipts & Deliveries
              </div>
              <div className="space-y-1 mt-1">
                {[...grouped.receipts, ...grouped.deliveries].map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => handleSelect(item.url)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-colors ${
                      results[selectedIndex] === item ? "bg-brand-50 ring-1 ring-brand-200" : "hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                        <div className="text-xs text-slate-500">{item.subtitle}</div>
                      </div>
                    </div>
                    {item.badge && (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {(grouped.transfers.length > 0 || grouped.adjustments.length > 0) && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
                Transfers & Adjustments
              </div>
              <div className="space-y-1 mt-1">
                {[...grouped.transfers, ...grouped.adjustments].map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => handleSelect(item.url)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-colors ${
                      results[selectedIndex] === item ? "bg-brand-50 ring-1 ring-brand-200" : "hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                        {item.type === "TRANSFER" ? (
                          <ArrowRightLeft className="w-4 h-4" />
                        ) : (
                          <SlidersHorizontal className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                        <div className="text-xs text-slate-500">{item.subtitle}</div>
                      </div>
                    </div>
                    {item.badge && (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Navigation: <kbd className="px-1.5 py-0.5 bg-white border rounded">↑</kbd> <kbd className="px-1.5 py-0.5 bg-white border rounded">↓</kbd> to move, <kbd className="px-1.5 py-0.5 bg-white border rounded">Enter</kbd> to open</span>
          <span><kbd className="px-1.5 py-0.5 bg-white border rounded">ESC</kbd> to close</span>
        </div>
      </div>
    </div>
  );
}

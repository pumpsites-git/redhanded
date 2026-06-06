'use client';

import { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onFilterState: (state: string) => void;
  onFilterParty: (party: string) => void;
  states: string[];
}

export default function SearchBar({ onSearch, onFilterState, onFilterParty, states }: SearchBarProps) {
  const [query, setQuery] = useState('');

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search by name, court, state, or law school..."
          className="w-full pl-10 pr-4 py-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--red-primary)] transition-colors"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onSearch(e.target.value);
          }}
        />
      </div>

      <select
        className="px-4 py-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] focus:outline-none focus:border-[var(--red-primary)] transition-colors cursor-pointer"
        onChange={(e) => onFilterState(e.target.value)}
        defaultValue=""
      >
        <option value="">All States</option>
        {states.map(s => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      <select
        className="px-4 py-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] focus:outline-none focus:border-[var(--red-primary)] transition-colors cursor-pointer"
        onChange={(e) => onFilterParty(e.target.value)}
        defaultValue=""
      >
        <option value="">All Parties</option>
        <option value="Democratic">Democratic</option>
        <option value="Republican">Republican</option>
      </select>
    </div>
  );
}

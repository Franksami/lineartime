'use client';

import { useState } from 'react';
import { useUser, UserButton } from '@clerk/nextjs';
import { Calendar, ChevronLeft, ChevronRight, Search, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderBarProps {
  year: number;
  onYearChange: (year: number) => void;
  className?: string;
}

export function HeaderBar({ year, onYearChange, className }: HeaderBarProps) {
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const handlePreviousYear = () => {
    onYearChange(year - 1);
  };

  const handleNextYear = () => {
    onYearChange(year + 1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement search functionality
    console.log('Searching for:', searchQuery);
  };

  return (
    <header className={cn('glass border-b border-glass-border', className)}>
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-glass-primary to-glass-accent flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-glass-primary to-glass-accent bg-clip-text text-transparent">
                LinearTime
              </h1>
            </div>

            {/* Year Selector */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePreviousYear}
                className="p-1.5 rounded-lg hover:bg-glass-primary/10 transition-colors"
                aria-label="Previous year"
              >
                <ChevronLeft className="w-5 h-5 text-glass-primary" />
              </button>
              <div className="px-4 py-1.5 rounded-lg bg-glass-primary/10 border border-glass-border min-w-[80px] text-center">
                <span className="text-lg font-semibold font-mono">{year}</span>
              </div>
              <button
                onClick={handleNextYear}
                className="p-1.5 rounded-lg hover:bg-glass-primary/10 transition-colors"
                aria-label="Next year"
              >
                <ChevronRight className="w-5 h-5 text-glass-primary" />
              </button>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative">
              <div className={cn(
                "relative transition-all duration-300",
                isSearchFocused ? "w-80" : "w-64"
              )}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-oklch-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  placeholder="Search events, dates..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-glass-primary/5 border border-glass-border focus:border-glass-primary focus:bg-glass-primary/10 focus:outline-none transition-all placeholder:text-oklch-gray-500"
                />
              </div>
            </form>

            {/* Settings Button */}
            <button
              className="p-2 rounded-lg hover:bg-glass-primary/10 transition-colors"
              aria-label="Settings"
            >
              <Settings className="w-5 h-5 text-oklch-gray-600" />
            </button>

            {/* User Profile */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">
                  {user?.firstName || 'User'}
                </p>
                <p className="text-xs text-oklch-gray-500">
                  {user?.primaryEmailAddress?.emailAddress || 'user@example.com'}
                </p>
              </div>
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-10 h-10",
                    userButtonTrigger: "focus:shadow-none",
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
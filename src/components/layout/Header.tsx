'use client';

import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface HeaderProps {
  title: string;
  description?: string;
}

export function Header({ title, description }: HeaderProps) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 sm:h-16 items-center justify-between border-b bg-background/95 px-3 sm:px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="min-w-0 flex-1">
        <h1 className="text-base sm:text-xl font-semibold truncate">{title}</h1>
        {description && (
          <p className="text-xs sm:text-sm text-muted-foreground truncate">{description}</p>
        )}
      </div>

      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 ml-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 sm:h-9 sm:w-9"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
        <ThemeToggle />
      </div>
    </header>
  );
}

import { useEffect, useState } from 'react';

function useMediaQuery(query: string): boolean {
  const normalizedQuery = query.replace('@media ', '');

  const [matches, setMatches] = useState(() => window.matchMedia(normalizedQuery).matches);

  useEffect(() => {
    const mediaQuery = window.matchMedia(normalizedQuery);
    setMatches(mediaQuery.matches);
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [normalizedQuery]);

  return matches;
}

export default useMediaQuery;

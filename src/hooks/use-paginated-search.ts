import { useEffect, useRef } from "react";

export function usePaginatedSearch(
  load: () => Promise<void>,
  searchText: string,
  pageDeps: React.DependencyList,
  skip = false,
): void {
  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    if (skip) return;
    const id = setTimeout(() => void loadRef.current(), searchText ? 300 : 0);
    return (): void => clearTimeout(id);
  }, [searchText, skip]);

  useEffect(() => {
    if (skip) return;
    void loadRef.current();
  }, [...pageDeps, skip]);
}

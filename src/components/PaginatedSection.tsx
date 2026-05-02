import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

interface PaginatedSectionProps<T> {
  items: T[];
  renderItem: (paginatedItems: T[]) => React.ReactNode;
  searchPlaceholder?: string;
  itemsPerPage?: number;
  className?: string;
}

export const PaginatedSection = <T,>({ 
  items, 
  renderItem, 
  searchPlaceholder = "Search...", 
  itemsPerPage = 5,
  className = ""
}: PaginatedSectionProps<T>) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredItems = useMemo(() => {
    if (!Array.isArray(items)) return [];
    if (!searchTerm) return items;
    const lowerSearch = searchTerm.toLowerCase();
    
    return items.filter(item => {
      // Deep search through object values
      const searchInObject = (obj: any, depth = 0): boolean => {
        if (depth > 3 || !obj) return false;
        for (const key in obj) {
          try {
            if (typeof obj[key] === 'object' && obj[key] !== null) {
              if (searchInObject(obj[key], depth + 1)) return true;
            } else if (String(obj[key]).toLowerCase().includes(lowerSearch)) {
              return true;
            }
          } catch (e) {
            continue;
          }
        }
        return false;
      };
      return searchInObject(item);
    });
  }, [items, searchTerm]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, start + maxVisiblePages - 1);
      
      if (end === totalPages) {
        start = Math.max(1, end - maxVisiblePages + 1);
      }
      
      for (let i = start; i <= end; i++) pages.push(i);
    }
    return pages;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder={searchPlaceholder} 
          className="pl-10 h-11 bg-muted/20 border-muted focus-visible:ring-primary" 
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
        />
      </div>
      
      {filteredItems.length === 0 ? (
        <div className="text-center py-12 bg-muted/10 rounded-xl border border-dashed">
          <p className="text-muted-foreground">No results found for "{searchTerm}"</p>
        </div>
      ) : (
        <>
          <div className="animate-in fade-in duration-500">
            {renderItem(paginatedItems)}
          </div>
          
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t mt-4">
              <div className="text-xs font-medium text-muted-foreground bg-muted/30 px-3 py-1 rounded-full">
                Showing <span className="text-foreground">{Math.min(filteredItems.length, (currentPage - 1) * itemsPerPage + 1)}</span> to <span className="text-foreground">{Math.min(filteredItems.length, currentPage * itemsPerPage)}</span> of <span className="text-foreground">{filteredItems.length}</span> entries
              </div>
              <div className="flex items-center gap-1.5">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={currentPage === 1}
                  onClick={() => goToPage(currentPage - 1)}
                  className="h-8 px-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center gap-1">
                  {getPageNumbers().map((page) => (
                    <Button 
                      key={page}
                      variant={currentPage === page ? "default" : "ghost"}
                      size="sm"
                      className={`h-8 w-8 p-0 text-xs font-bold ${currentPage === page ? 'shadow-md shadow-primary/20' : ''}`}
                      onClick={() => goToPage(page)}
                    >
                      {page}
                    </Button>
                  ))}
                  {totalPages > 5 && getPageNumbers()[getPageNumbers().length - 1] < totalPages && (
                    <span className="text-muted-foreground px-1">...</span>
                  )}
                </div>

                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={currentPage === totalPages}
                  onClick={() => goToPage(currentPage + 1)}
                  className="h-8 px-2"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

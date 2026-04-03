import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-4">
      <Link
        to="/"
        className="flex items-center hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>
      {pathnames.length > 0 && (
        <ChevronRight className="h-4 w-4 shrink-0 opacity-50" />
      )}
      {pathnames.map((value, index) => {
        const last = index === pathnames.length - 1;
        const to = `/${pathnames.slice(0, index + 1).join("/")}`;
        const label = value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, " ");

        return (
          <React.Fragment key={to}>
            {last ? (
              <span className="font-medium text-foreground truncate max-w-[150px] sm:max-w-none">
                {label}
              </span>
            ) : (
              <>
                <Link
                  to={to}
                  className="hover:text-foreground transition-colors truncate max-w-[100px] sm:max-w-none"
                >
                  {label}
                </Link>
                <ChevronRight className="h-4 w-4 shrink-0 opacity-50" />
              </>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

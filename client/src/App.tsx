import { useState, useMemo } from "react";
import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { EditAuthContext } from "@/lib/report";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Edit secret held ONLY in React memory — never localStorage/sessionStorage/cookies.
  const [secret, setSecret] = useState<string | null>(null);
  const auth = useMemo(
    () => ({ secret, setSecret, isEditor: !!secret }),
    [secret],
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <EditAuthContext.Provider value={auth}>
          <TooltipProvider>
            <Toaster />
            <Router hook={useHashLocation}>
              <AppRouter />
            </Router>
          </TooltipProvider>
        </EditAuthContext.Provider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

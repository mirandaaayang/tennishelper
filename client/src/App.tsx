import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      {/* This is a headless tennis booking bot - no web interface */}
      {/* All functionality runs server-side via Express endpoints */}
      
      {/* Health check can be accessed at /api/health */}
      {/* Manual trigger available at /api/trigger-booking (for testing) */}
      {/* Twilio webhook endpoint: /api/webhook/twilio */}
      
      {/* Fallback to 404 for any web requests */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

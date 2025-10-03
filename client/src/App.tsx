import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { Footer } from "@/components/footer";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Project from "@/pages/project";
import Characters from "@/pages/characters";
import Worldbuilding from "@/pages/worldbuilding";
import Timeline from "@/pages/timeline";
import Analytics from "@/pages/analytics";
import Subscription from "@/pages/subscription";
import SearchResultsPage from "@/pages/search-results";
import PromptLibraryPage from "@/pages/prompt-library";
import Privacy from "@/pages/privacy";
import Terms from "@/pages/terms";
import Cookies from "@/pages/cookies";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      <Route path="/cookies" component={Cookies} />
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/search" component={SearchResultsPage} />
          <Route path="/prompts" component={PromptLibraryPage} />
          <Route path="/projects/:id" component={Project} />
          <Route path="/projects/:id/characters" component={Characters} />
          <Route path="/projects/:id/worldbuilding" component={Worldbuilding} />
          <Route path="/projects/:id/timeline" component={Timeline} />
          <Route path="/projects/:id/analytics" component={Analytics} />
          <Route path="/subscription" component={Subscription} />
        </>
      )}
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
        <Footer />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

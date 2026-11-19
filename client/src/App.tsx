import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Login from "./pages/Login";
import Workspace from "./pages/Workspace";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={Workspace} />
      <Route path="/investigator/dashboard" component={Workspace} />
      <Route path="/analyst/dashboard" component={Workspace} />
      <Route path="/admin/dashboard" component={Workspace} />
      <Route path="/complaints" component={Workspace} />
      <Route path="/complaints/:id" component={Workspace} />
      <Route path="/transactions" component={Workspace} />
      <Route path="/predictions" component={Workspace} />
      <Route path="/risk-map" component={Workspace} />
      <Route path="/alerts" component={Workspace} />
      <Route path="/cases" component={Workspace} />
      <Route path="/cases/:id" component={Workspace} />
      <Route path="/network" component={Workspace} />
      <Route path="/analytics" component={Workspace} />
      <Route path="/models" component={Workspace} />
      <Route path="/data" component={Workspace} />
      <Route path="/reports" component={Workspace} />
      <Route path="/audit-logs" component={Workspace} />
      <Route path="/audit" component={Workspace} />
      <Route path="/settings" component={Workspace} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider defaultTheme="dark">
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Membership from "./pages/Membership";
import Financials from "./pages/Financials";
import Groups from "./pages/Groups";
import Reporting from "./pages/Reporting";
import Settings from "./pages/Settings";
import { AppProvider } from "./context/AppContext";
import { ThemeProvider } from "./context/ThemeContext";
import { FirebaseProvider } from "./context/FirebaseContext";
import { Toaster } from "./components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="gec-cms-theme">
      <FirebaseProvider>
        <AppProvider>
          <TooltipProvider>
            <Router>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/membership" element={<Membership />} />
                  <Route path="/financials" element={<Financials />} />
                  <Route path="/groups" element={<Groups />} />
                  <Route path="/reporting" element={<Reporting />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </Layout>
            </Router>
            <Toaster position="top-right" />
          </TooltipProvider>
        </AppProvider>
      </FirebaseProvider>
    </ThemeProvider>
  );
}

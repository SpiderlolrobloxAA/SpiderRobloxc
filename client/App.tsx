import "./global.css";

import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Index from "./pages/Index";
import Marketplace from "./pages/Marketplace";
import Shop from "./pages/Shop";
import Placeholder from "./pages/Placeholder";
import Quests from "./pages/Quests";
import Profile from "./pages/Profile";
import Transactions from "./pages/Transactions";
import Messages from "./pages/Messages";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminPanel from "./pages/AdminPanel";
import RequireAuth from "@/components/RequireAuth";
import { AuthProvider } from "@/context/AuthProvider";
import { ProfileProvider } from "@/context/ProfileProvider";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <ProfileProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Index />} />
                <Route
                  path="/marketplace"
                  element={
                    <RequireAuth>
                      <Marketplace />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/shop"
                  element={
                    <RequireAuth>
                      <Shop />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/rotcoins"
                  element={
                    <RequireAuth>
                      <Shop />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/quests"
                  element={
                    <RequireAuth>
                      <Quests />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/quetes"
                  element={
                    <RequireAuth>
                      <Quests />
                    </RequireAuth>
                  }
                />
                <Route path="/profile" element={<Profile />} />
                <Route
                  path="/transactions"
                  element={
                    <RequireAuth>
                      <Transactions />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/tickets"
                  element={
                    <RequireAuth>
                      <Placeholder title="Tickets support" />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/messages"
                  element={
                    <RequireAuth>
                      <Messages />
                    </RequireAuth>
                  }
                />
                <Route path="/admin" element={<AdminPanel />} />
                <Route
                  path="/sell"
                  element={
                    <RequireAuth>
                      <Placeholder title="Commencer à vendre" />
                    </RequireAuth>
                  }
                />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ProfileProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);

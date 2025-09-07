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
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
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
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/quests" element={<Placeholder title="Quêtes sociales" />} />
              <Route path="/profile" element={<Placeholder title="Profil" />} />
              <Route path="/transactions" element={<Placeholder title="Transactions" />} />
              <Route path="/tickets" element={<Placeholder title="Tickets support" />} />
              <Route path="/sell" element={<Placeholder title="Commencer à vendre" />} />
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

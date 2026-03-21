import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { ROUTES, ROLES } from "@/lib/constants";
import { lazyWithRetry } from "@/lib/lazyWithRetry";
import { ReferralTracker } from "@/components/ReferralTracker";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const routeLazy = (importer: Parameters<typeof lazyWithRetry>[0]) => lazy(lazyWithRetry(importer));

// Importaciones dinámicas para optimización de carga (Lazy Loading)
const Index = routeLazy(() => import("./pages/Index"));
const Landing = routeLazy(() => import("./pages/Landing"));
const Auth = routeLazy(() => import("./pages/Auth"));
const Admin = routeLazy(() => import("./pages/Admin"));
const AgentDashboard = routeLazy(() => import("./pages/AgentDashboard"));
const NotFound = routeLazy(() => import("./pages/NotFound"));
const PublicPropertyView = routeLazy(() => import("./pages/PublicPropertyView"));
const Referral = routeLazy(() => import("./pages/Referral"));
const LegalTerms = routeLazy(() => import("./pages/LegalTerms"));
const LegalPrivacy = routeLazy(() => import("./pages/LegalPrivacy"));
const AuthRecoverPassword = routeLazy(() => import("./pages/AuthRecoverPassword"));
const AuthResetPassword = routeLazy(() => import("./pages/AuthResetPassword"));

const queryClient = new QueryClient();

/**
 * Componente de carga simple que se muestra mientras se descarga el chunk de la página.
 */
const LoadingPage = () => (
  <div className="min-h-screen w-full flex items-center justify-center bg-background">
    <Loader2 className="w-10 h-10 animate-spin text-primary" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ReferralTracker />
        <Suspense fallback={<LoadingPage />}>
          <ErrorBoundary>
            <Routes>
              <Route path={ROUTES.HOME} element={<Landing />} />
              <Route path={ROUTES.AUTH} element={<Auth />} />
              <Route path={ROUTES.AUTH_RECOVER} element={<AuthRecoverPassword />} />
              <Route path={ROUTES.AUTH_RESET_PASSWORD} element={<AuthResetPassword />} />
              <Route path={ROUTES.TERMS} element={<LegalTerms />} />
              <Route path={ROUTES.PRIVACY} element={<LegalPrivacy />} />
              <Route path={ROUTES.PUBLIC_PROPERTY_PATH} element={<PublicPropertyView />} />
              <Route path={ROUTES.REFERRAL_PATH} element={<Referral />} />
              
              {/* Rutas Protegidas Simples (Solo requieren estar logeado) */}
              <Route path={ROUTES.DASHBOARD} element={<ProtectedRoute><Index /></ProtectedRoute>} />
              
              {/* Rutas Protegidas con Roles Específicos */}
              <Route path={ROUTES.ADMIN} element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]}><Admin /></ProtectedRoute>} />
              <Route path={ROUTES.ADMIN_SECTION_PATH} element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]}><Admin /></ProtectedRoute>} />
              <Route
                path={ROUTES.AGENCY}
                element={
                  <ProtectedRoute allowedRoles={[ROLES.AGENCY, ROLES.AGENCY_MEMBER]}>
                    <AgentDashboard />
                  </ProtectedRoute>
                }
              />

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ErrorBoundary>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

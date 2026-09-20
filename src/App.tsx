import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppLayout, FocusLayout } from "./components/Layout";
import { Loading } from "./components/ui";
import { DeckDetail } from "./pages/DeckDetail";
import { DeckNew } from "./pages/DeckNew";
import { Decks } from "./pages/Decks";
import { Explore } from "./pages/Explore";
import { Home } from "./pages/Home";
import { Landing } from "./pages/Landing";
import { Progress } from "./pages/Progress";
import { Quiz } from "./pages/Quiz";
import { QuizPicker } from "./pages/QuizPicker";
import { Review } from "./pages/Review";
import { ReviewPicker } from "./pages/ReviewPicker";
import { SignIn } from "./pages/SignIn";
import { SignUp } from "./pages/SignUp";
import { ApiError } from "./lib/api";
import { AuthProvider, useAuth } from "./lib/auth";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Reintentar un 401 o un 404 no cambia nada; un fallo de red sí.
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
        return failureCount < 2;
      },
    },
  },
});

/** Exige sesión; si no la hay, manda a iniciar sesión y recuerda a dónde iba. */
function Protegida({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loading label="Restaurando tu sesión…" />;
  if (!user) return <Navigate to="/entrar" state={{ from: location.pathname }} replace />;
  return <>{children}</>;
}

/** La landing y el login no tienen sentido con la sesión ya iniciada. */
function SoloInvitados({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (user) return <Navigate to="/inicio" replace />;
  return <>{children}</>;
}

function Rutas() {
  return (
    <Routes>
      <Route path="/" element={<SoloInvitados><Landing /></SoloInvitados>} />
      <Route path="/entrar" element={<SoloInvitados><SignIn /></SoloInvitados>} />
      <Route path="/crear-cuenta" element={<SoloInvitados><SignUp /></SoloInvitados>} />

      <Route element={<Protegida><AppLayout /></Protegida>}>
        <Route path="/inicio" element={<Home />} />
        <Route path="/explorar" element={<Explore />} />
        <Route path="/progreso" element={<Progress />} />
        <Route path="/repasar" element={<ReviewPicker />} />
        <Route path="/quiz" element={<QuizPicker />} />
        <Route path="/mis-mazos" element={<Decks />} />
        <Route path="/mis-mazos/nuevo" element={<DeckNew />} />
        <Route path="/mis-mazos/:topicId" element={<DeckDetail />} />
      </Route>

      {/* Estudiar y responder el quiz usan un marco sin navegación, para no
          distraer a media sesión. */}
      <Route element={<Protegida><FocusLayout /></Protegida>}>
        <Route path="/repasar/:topicId" element={<Review />} />
        <Route path="/quiz/:topicId" element={<Quiz />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Rutas />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

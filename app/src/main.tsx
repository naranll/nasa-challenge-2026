import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import { I18nProvider } from "./i18n";
import Home from "./pages/Home";
import { ROUTES } from "./routes";
import "./styles.css";

// Only the home page is in the first download; the others load when opened (they carry their own globes).
const Harmonizing = lazy(() => import("./pages/Harmonizing"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Story = lazy(() => import("./pages/Story"));
const Forecast = lazy(() => import("./pages/Forecast"));

// HashRouter: GitHub Pages has no server-side routing, so deep links must live after "#".
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <I18nProvider>
      <HashRouter>
        <Suspense fallback={null}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path={ROUTES.harmonizing.slice(1)} element={<Harmonizing />} />
            <Route path={ROUTES.dashboard.slice(1)} element={<Dashboard />} />
            <Route path={ROUTES.story.slice(1)} element={<Story />} />
            <Route path={ROUTES.forecast.slice(1)} element={<Forecast />} />
          </Route>
        </Routes>
        </Suspense>
      </HashRouter>
    </I18nProvider>
  </StrictMode>,
);

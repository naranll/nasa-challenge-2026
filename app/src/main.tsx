import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import { I18nProvider } from "./i18n";
import Dashboard from "./pages/Dashboard";
import Forecast from "./pages/Forecast";
import Harmonizing from "./pages/Harmonizing";
import Home from "./pages/Home";
import Story from "./pages/Story";
import { ROUTES } from "./routes";
import "./styles.css";

// HashRouter: GitHub Pages has no server-side routing, so deep links must live after "#".
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <I18nProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path={ROUTES.harmonizing.slice(1)} element={<Harmonizing />} />
            <Route path={ROUTES.dashboard.slice(1)} element={<Dashboard />} />
            <Route path={ROUTES.story.slice(1)} element={<Story />} />
            <Route path={ROUTES.forecast.slice(1)} element={<Forecast />} />
          </Route>
        </Routes>
      </HashRouter>
    </I18nProvider>
  </StrictMode>,
);

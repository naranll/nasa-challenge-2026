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
import "./styles.css";

// HashRouter: GitHub Pages has no server-side routing, so deep links must live after "#".
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <I18nProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="harmonizing" element={<Harmonizing />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="story" element={<Story />} />
            <Route path="forecast" element={<Forecast />} />
          </Route>
        </Routes>
      </HashRouter>
    </I18nProvider>
  </StrictMode>,
);

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/fraunces/opsz.css";
import "@fontsource-variable/fraunces/opsz-italic.css";
import "@fontsource/alegreya-sans/400.css";
import "@fontsource/alegreya-sans/500.css";
import "@fontsource/alegreya-sans/700.css";
import "@fontsource/alegreya-sans/400-italic.css";
import "@fontsource-variable/jetbrains-mono";
import { AppProvider } from "./app/store";
import { Shell } from "./components/Shell";
import "./styles/base.css";
import "./styles/shell.css";
import "./styles/table.css";
import "./styles/panel.css";
import "./styles/chat.css";
import "./styles/dialogs.css";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConvexProvider client={convex}>
      <AppProvider><Shell /></AppProvider>
    </ConvexProvider>
  </StrictMode>,
);

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { StrictMode, useCallback, useState } from "react";
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
import "./styles/game.css";

// No console output and no "unsaved changes" prompt from the client: a lost connection and a seat the server has gone
// quiet for must look the same in every way (docs/architecture.md, "Presence and the gate").
const makeClient = () => new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string, { logger: false, unsavedChangesWarning: false });

/**
 * The connection, replaceable: when something the app has reported as "not sent" might still be waiting in the
 * client's queue (a lost network keeps it there and would deliver it on reconnecting), the client is replaced, so
 * nothing typed while unreachable is ever delivered later.
 */
function Root() {
  const [convex, setConvex] = useState(makeClient);
  const reset = useCallback(() => setConvex(old => { void old.close(); return makeClient(); }), []);
  return (
    <ConvexProvider client={convex}>
      <AppProvider resetConnection={reset}><Shell /></AppProvider>
    </ConvexProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);

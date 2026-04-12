import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { MDXProvider } from "@mdx-js/react";
import { RootLayout } from "./components/RootLayout";
import { Landing } from "./pages/Landing";
import { Docs } from "./pages/Docs";
import { DocPage } from "./pages/DocPage";
import { NotFound } from "./pages/NotFound";
import { mdxComponents } from "./components/mdxComponents";
import "./styles/globals.css";

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: "/", element: <Landing /> },
      { path: "/docs", element: <Docs /> },
      { path: "/docs/:slug", element: <DocPage /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

const root = document.getElementById("root");
if (!root) throw new Error("#root missing");

createRoot(root).render(
  <StrictMode>
    <MDXProvider components={mdxComponents}>
      <RouterProvider router={router} />
    </MDXProvider>
  </StrictMode>,
);

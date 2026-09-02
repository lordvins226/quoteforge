import { Outlet } from "react-router-dom";
import { ScrollToTop } from "./ScrollToTop";
import { Canonical } from "./Canonical";

export function RootLayout() {
  return (
    <>
      <ScrollToTop />
      <Canonical />
      <Outlet />
    </>
  );
}

import { Outlet } from "react-router-dom";
import { ScrollToTop } from "./ScrollToTop";

export function RootLayout() {
  return (
    <>
      <ScrollToTop />
      <Outlet />
    </>
  );
}

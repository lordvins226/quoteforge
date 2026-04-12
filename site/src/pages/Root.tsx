import { Outlet } from "react-router-dom";
import { ScrollToTop } from "../components/ScrollToTop";

export function Root() {
  return (
    <>
      <ScrollToTop />
      <Outlet />
    </>
  );
}

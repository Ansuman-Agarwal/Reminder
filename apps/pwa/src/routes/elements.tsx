import LoadingScreen from "@/component/loading-screen";
import { Suspense, lazy, ElementType } from "react";
// components

// ----------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Loadable = (Component: ElementType) => (props: any) => (
  <Suspense fallback={<LoadingScreen />}>
    <Component {...props} />
  </Suspense>
);

// ----------------------------------------------------------------------

export const LoginPage = Loadable(
  lazy(() => import("../pages/auth/LoginPage"))
);

export const PageOne = Loadable(lazy(() => import("../pages/PageOne")));

export const ProfilePage = Loadable(lazy(() => import("../pages/Profilepage")));

export const Page404 = Loadable(lazy(() => import("../pages/Page404")));

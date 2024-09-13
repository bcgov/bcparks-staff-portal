import { createBrowserRouter } from "react-router-dom";
import App from "./pages/App";
import MainLayout from "./layouts/MainLayout";
import ErrorPage from "./pages/Error";
import Foo from "./pages/Foo";
import Bar from "./pages/Bar";

const RouterConfig = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "/",
        element: <App />,
      },
      {
        path: "/foo/:fooId",
        element: <Foo />,
      },
      {
        path: "/bar",
        element: <Bar />,
      },
    ],
  },
  {
    path: "/hello",
    element: <div>Hello world!</div>,
  },
], { basename: "/v2/" });

export default RouterConfig;

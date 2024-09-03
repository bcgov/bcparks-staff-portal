import { Outlet, Link } from "react-router-dom";

export default function MainLayout() {
  return (
    <>
      <div>
        <h1>Router test</h1>

        <nav>
          <ul style={{ listStyle: "none" }}>
            <li>
              <Link to={`/`}>Home page</Link>
            </li>
            <li>
              <Link to={`/foo/A`}>Foo page A</Link>
            </li>
            <li>
              <Link to={`/foo/B`}>Foo page B</Link>
            </li>
            <li>
              <Link to={`/bar`}>Bar page</Link>
            </li>
          </ul>
        </nav>
      </div>

      <main>
        <Outlet />
      </main>
    </>
  );
}

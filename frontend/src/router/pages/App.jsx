import { useState } from "react";
import reactLogo from "../../assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import axios from "axios";

function App() {
  const [apiData, setApiData] = useState(null);
  const [loading, setLoading] = useState(false);

  async function getData(rowId) {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://0.0.0.0:8100/nested-path-example/orm-${rowId}`,
      );

      setApiData(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setApiData(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button disabled={loading} onClick={() => getData(1)}>
          Get DB row 1
        </button>
        &nbsp;
        <button disabled={loading} onClick={() => getData(2)}>
          Get DB row 2
        </button>
        {loading && <p>Loading...</p>}
        {!loading && apiData && <p>{apiData.specificRow.name}</p>}
        {!loading && !apiData && <p>Click a button to test the API</p>}
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  );
}

export default App;

import { useState } from "react";
import "./ApiTest.scss";
import axios from "axios";
import { useAuth } from "react-oidc-context";

function ApiTest() {
  const [apiData, setApiData] = useState(null);
  const [loading, setLoading] = useState(false);

  const auth = useAuth();

  async function getData(rowId) {
    try {
      const token = auth?.user?.access_token;

      setLoading(true);
      const response = await axios.get(
        `http://0.0.0.0:8100/nested-path-example/orm-${rowId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setApiData(response.data.specificRow.name);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setApiData(null);

      if (error.status === 401) {
        setApiData("error: not logged in");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h1>API test page</h1>

      <div className="card gap-2">
        <div className="row">
          <div className="col-6 d-grid">
            <button
              className="btn btn-primary"
              disabled={loading}
              onClick={() => getData(1)}
            >
              🔒 Get DB row 1
            </button>
          </div>
          <div className="col-6 d-grid">
            <button
              className="btn btn-primary"
              disabled={loading}
              onClick={() => getData(2)}
            >
              🔒 Get DB row 2
            </button>
          </div>
        </div>
        <div className="row">
          <div className="row-12">
            {loading && <p className="mb-0">Loading...</p>}
            {!loading && apiData && <p className="mb-0">{apiData}</p>}
            {!loading && !apiData && (
              <p className="mb-0">Click a button to test the API</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default ApiTest;

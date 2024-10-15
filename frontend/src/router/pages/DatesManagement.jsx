// import { useState } from "react";

function DatesManagement() {
  return (
    <div className="page dates-management">
      <header>
        <h1>Dates management</h1>
      </header>

      <div className="table-filters row mb-4">
        <div className="col-lg-3 col-md-6 col-12">
          <label htmlFor="parkName" className="form-label">
            Park name
          </label>

          <input
            type="text"
            className="form-control input-search"
            id="parkName"
            placeholder="Search by park name"
          />
        </div>

        <div className="col-lg-3 col-md-6 col-12">
          <label htmlFor="status" className="form-label">
            Status
          </label>

          <select id="status" className="form-select">
            <option value=""></option>
          </select>
        </div>

        <div className="col-lg-3 col-md-6 col-12">
          <label htmlFor="bundle" className="form-label">
            Bundle
          </label>

          <select id="bundle" className="form-select">
            <option value=""></option>
          </select>
        </div>

        <div className="col-lg-3 col-md-6 col-12 d-flex">
          <button className="btn btn-link align-self-end">Clear filters</button>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-striped table-hover">
          <thead>
            <tr>
              <th scope="col">Park name</th>
              <th scope="col">Status</th>
              <th scope="col">Bundle</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <th scope="row">Elk Falls Park</th>
              <td>
                <span className="badge rounded-pill text-bg-warning">
                  Requested
                </span>
              </td>
              <td>&nbsp;</td>
            </tr>
            <tr>
              <th scope="row">Elk Lakes Park</th>
              <td>
                <span className="badge rounded-pill text-bg-warning">
                  Requested
                </span>
              </td>
              <td>&nbsp;</td>
            </tr>
            <tr>
              <th scope="row">Elk Valley Park</th>
              <td>
                <span className="badge rounded-pill text-bg-success ">
                  Approved
                </span>
              </td>
              <td>&nbsp;</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DatesManagement;

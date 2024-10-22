function PublishPage() {
  return (
    <div className="page publish">
      <div className="d-flex justify-content-end mb-2">
        <button className="btn btn-primary">Publish to API</button>
      </div>

      <div className="table-responsive">
        <table className="table table-striped">
          <thead>
            <tr>
              <th scope="col">Park name</th>
              <th scope="col">Feature</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Golden Ears</td>
              <td className="fw-bold">Alouette Campground</td>
            </tr>
            <tr>
              <td>Golden Ears</td>
              <td className="fw-bold">Gold Creek Campground</td>
            </tr>
            <tr>
              <td>Golden Ears</td>
              <td className="fw-bold">North Beach Campground</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PublishPage;

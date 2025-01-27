import { useParams } from "react-router-dom";

export default function SubmitWinterFeesDates() {
  const { seasonId } = useParams();

  return (
    <div className="page preview-winter-fees-changes">
      <p>Preview winter fees changes page</p>

      <p>
        Winter fee season ID: <code>{seasonId}</code>
      </p>
    </div>
  );
}

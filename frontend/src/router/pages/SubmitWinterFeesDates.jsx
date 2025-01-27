import { useParams } from "react-router-dom";

export default function SubmitWinterFeesDates() {
  const { seasonId } = useParams();

  return (
    <div className="page submit-winter-fees-dates">
      <p>Submit winter fees dates page</p>

      <p>
        Winter fee season ID: <code>{seasonId}</code>
      </p>
    </div>
  );
}

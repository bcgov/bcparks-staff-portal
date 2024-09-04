import { useParams } from "react-router-dom";

export default function FooPage() {
  const params = useParams();

  return (
    <div id="foo page">
      <h1>Foo page {params.fooId}!</h1>
    </div>
  );
}

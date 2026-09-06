import { Link } from 'react-router-dom';
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@y-sebaei/concrete-ui';

export function NotFoundPage() {
  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>That screen does not exist</CardTitle>
        <CardDescription>The console has two sections: events and orders.</CardDescription>
      </CardHeader>
      <CardBody>
        <Link
          to="/events"
          className="cui-focus rounded-md font-ui text-body font-medium text-accent-text hover:underline"
        >
          Go to events
        </Link>
      </CardBody>
    </Card>
  );
}

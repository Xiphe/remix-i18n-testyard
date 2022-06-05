import { Link } from '@remix-run/react';

export default function Component() {
  return (
    <Link to="deep" prefetch="intent">
      Deep
    </Link>
  );
}

import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  // Redirect to login - middleware will handle auth check
  redirect('/login');
}

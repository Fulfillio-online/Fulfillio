import { redirect } from 'next/navigation';

export default function WmsLoginPage() {
  redirect('/login?role=worker');
}

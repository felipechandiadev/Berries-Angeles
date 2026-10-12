import { redirect } from 'next/navigation';

export default function LegacyStoragesRedirect() {
  redirect('/home');
}

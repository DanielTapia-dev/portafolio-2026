import {redirect} from 'next/navigation';
import {ADMIN_HOME} from '@/lib/admin/require-admin';

export default function AdminIndex() {
  redirect(ADMIN_HOME);
}

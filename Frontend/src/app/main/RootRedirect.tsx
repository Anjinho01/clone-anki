import { Navigate } from 'react-router-dom';
/* Store */
import { useSelector } from 'react-redux';
import { selectUserRole } from 'app/store/user/userSlice';

const ROUTE_BY_ROLE: Record<string, string> = {
  develop: '/users',
  admin: '/users',
  monitor: '/packages',
  user: '/decks',
};

function normalizeRole(role: string | null | undefined): string {
  return String(role ?? '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

const RootRedirect: React.FC = () => {
  const userRole = useSelector(selectUserRole);
  const normalizedRole = normalizeRole(userRole);

  if (!normalizedRole) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={ROUTE_BY_ROLE[normalizedRole] ?? '/logout'} replace />;
};

export default RootRedirect;

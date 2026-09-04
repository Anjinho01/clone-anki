import FuseUtils from '@fuse/utils';
import type { CommonProps } from '@fuse/@types/common';

interface AuthorityCheckProps extends CommonProps {
  role: string;
  authority: string[];
}

const AuthorityCheck = (props: AuthorityCheckProps) => {
  const { role = '', authority = [], children } = props;

  const roleMatched = FuseUtils.hasPermission(authority, role);

  return <>{roleMatched ? children : null}</>;
};

export default AuthorityCheck;

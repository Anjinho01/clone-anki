import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
/* Components */
import Card from '@fuse/ui/Card';
import Skeleton from '@fuse/ui/Skeleton';
/* Store */
import { useAppSelector } from 'app/store';
import { selectLoadingUsers, selectPagination } from './store/usersSlice';

function UsersHeader() {
  const loading = useAppSelector(selectLoadingUsers);
  const pagination = useAppSelector(selectPagination);
  const { totalRecords } = pagination;

  const [display, setDisplay] = useState(false);

  useEffect(() => {
    if (loading) {
      setTimeout(() => {
        setDisplay(true);
      }, 800);
    }
  }, [loading]);

  return (
    <Card className="bg-primary">
      <div className="flex min-h-[90] flex-col items-start justify-start">
        <motion.span
          className="flex w-full items-start"
          initial={{ x: -20 }}
          animate={{ x: 0, transition: { delay: 0.2 } }}
        >
          <h3 className="text-white">Gestão de Usuários</h3>
        </motion.span>

        <motion.span
          className="flex w-full flex-row"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1, transition: { delay: 0.2 } }}
        >
          {!display ? (
            <Skeleton className="mt-2" height={10} width="15%" />
          ) : (
            <p className="text-white">{totalRecords} usuários</p>
          )}
        </motion.span>
      </div>
    </Card>
  );
}

export default UsersHeader;

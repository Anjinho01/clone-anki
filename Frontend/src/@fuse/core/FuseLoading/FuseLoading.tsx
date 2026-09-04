import { useState } from 'react';
import { useTimeout } from '@fuse/hooks';
import Loading from '@fuse/shared/Loading';

export type FuseLoadingProps = {
  delay?: number;
  className?: string;
};

/**
 * FuseLoading exibe um estado de carregamento com um delay opcional.
 */
function FuseLoading(props: FuseLoadingProps) {
  const { delay = 0 } = props;
  const [showLoading, setShowLoading] = useState(!delay);

  useTimeout(() => {
    setShowLoading(true);
  }, delay);

  return (
    <div className="flex h-[100vh] flex-auto flex-col">
      <Loading loading={showLoading} />
    </div>
  );
}

export default FuseLoading;

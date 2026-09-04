import classNames from '@fuse/ui/utils/classNames';
import Badge from '@fuse/ui/Badge';
import { PiBellDuotone } from 'react-icons/pi';

const NotificationToggle = ({ className, dot }: { className?: string; dot: boolean }) => {
  return (
    <div className={classNames('text-2xl', className)}>
      {dot ? (
        <Badge badgeStyle={{ top: '3px', right: '6px' }}>
          <PiBellDuotone />
        </Badge>
      ) : (
        <PiBellDuotone />
      )}
    </div>
  );
};

export default NotificationToggle;

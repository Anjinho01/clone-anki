import { useMemo } from 'react';
import Tooltip from '@fuse/ui/Tooltip';
import Avatar from '@fuse/ui/Avatar';
import acronym from '@fuse/utils/acronym';
import useRandomBgColor from '@fuse/hooks/useRandomBgColor';
import type { AvatarProps, AvatarGroupProps } from '@fuse/ui/Avatar';

type User = Record<string, string>;

interface UsersAvatarGroupProps extends AvatarGroupProps {
  avatarGroupProps?: AvatarGroupProps;
  avatarProps?: AvatarProps;
  imgKey?: string;
  nameKey?: string;
  onAvatarClick?: (avatar: User) => void;
  users?: User[];
}

const UsersAvatarGroup = (props: UsersAvatarGroupProps) => {
  const {
    avatarGroupProps = {},
    avatarProps = {},
    imgKey = 'img',
    nameKey = 'name',
    onAvatarClick,
    users = [],
    ...rest
  } = props;

  const bgColor = useRandomBgColor();

  const defaultAvatarProps = useMemo(() => {
    return {
      shape: 'circle' as 'round' | 'circle' | 'square',
      size: 30,
      className: 'cursor-pointer',
      ...avatarProps,
    };
  }, [avatarProps]);

  const handleAvatarClick = (avatar: User) => {
    onAvatarClick?.(avatar);
  };

  return (
    <Avatar.Group
      omittedAvatarTooltip
      chained
      omittedAvatarProps={defaultAvatarProps}
      omittedAvatarTooltipProps={{
        wrapperClass: 'flex',
      }}
      {...avatarGroupProps}
      {...rest}
    >
      {users.map((elm, index) => (
        <Tooltip key={elm[nameKey] + index} wrapperClass="flex" title={elm[nameKey]}>
          <Avatar
            {...defaultAvatarProps}
            className={`${
              elm[imgKey] ? '' : bgColor(elm[nameKey])
            } ${defaultAvatarProps.className}`}
            src={elm[imgKey]}
            onClick={() => handleAvatarClick(elm)}
          >
            {acronym(elm.name)}
          </Avatar>
        </Tooltip>
      ))}
    </Avatar.Group>
  );
};

export default UsersAvatarGroup;

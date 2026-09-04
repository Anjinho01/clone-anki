import type { ReactNode } from 'react';
import {
  HiCheckCircle,
  HiOutlineInformationCircle,
  HiOutlineExclamation,
  HiOutlineExclamationCircle,
} from 'react-icons/hi';
import Avatar from '@fuse/ui/Avatar';
import Button from '@fuse/ui/Button';
import Dialog from '@fuse/ui/Dialog';
import type { DialogProps } from '@fuse/ui/Dialog';
import type { ButtonProps } from '@fuse/ui/Button';

type StatusType = 'info' | 'success' | 'warning' | 'danger';

interface ConfirmDialogProps extends DialogProps {
  cancelText?: ReactNode | string;
  confirmText?: ReactNode | string;
  confirmButtonProps?: ButtonProps;
  cancelButtonProps?: ButtonProps;
  type?: StatusType;
  title?: ReactNode | string;
  onCancel?: () => void;
  onConfirm?: () => void;
}

const StatusIcon = ({ status }: { status: StatusType }) => {
  switch (status) {
    case 'info':
      return (
        <Avatar
          className="bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-100"
          shape="circle"
        >
          <span className="text-2xl">
            <HiOutlineInformationCircle />
          </span>
        </Avatar>
      );
    case 'success':
      return (
        <Avatar
          className="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100"
          shape="circle"
        >
          <span className="text-2xl">
            <HiCheckCircle />
          </span>
        </Avatar>
      );
    case 'warning':
      return (
        <Avatar className="bg-amber-100 text-amber-600 dark:text-amber-100" shape="circle">
          <span className="text-2xl">
            <HiOutlineExclamationCircle />
          </span>
        </Avatar>
      );
    case 'danger':
      return (
        <Avatar className="bg-red-100 text-red-600 dark:text-red-100" shape="circle">
          <span className="text-2xl">
            <HiOutlineExclamation />
          </span>
        </Avatar>
      );

    default:
      return null;
  }
};

const ConfirmDialog = (props: ConfirmDialogProps) => {
  const {
    type = 'info',
    title,
    children,
    onCancel,
    onConfirm,
    cancelText = 'Cancel',
    confirmText = 'Confirm',
    confirmButtonProps,
    cancelButtonProps,
    ...rest
  } = props;

  const handleCancel = () => {
    onCancel?.();
  };

  const handleConfirm = () => {
    onConfirm?.();
  };

  return (
    <Dialog contentClassName="pb-0 px-0" {...rest}>
      <div className="flex px-6 pt-2 pb-6">
        <div>
          <StatusIcon status={type} />
        </div>
        <div className="ml-4 rtl:mr-4">
          <h5 className="mb-2">{title}</h5>
          {children}
        </div>
      </div>
      <div className="rounded-br-2xl rounded-bl-2xl bg-gray-100 px-6 py-3 dark:bg-gray-700">
        <div className="flex items-center justify-end gap-2">
          <Button size="sm" onClick={handleCancel} {...cancelButtonProps}>
            {cancelText}
          </Button>
          <Button size="sm" variant="solid" onClick={handleConfirm} {...confirmButtonProps}>
            {confirmText}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

export default ConfirmDialog;

import Modal from 'react-modal';
import classNames from 'classnames';
import CloseButton from '../CloseButton';
import { motion } from 'framer-motion';
import useWindowSize from '../hooks/useWindowSize';
import type ReactModal from 'react-modal';
import type { MouseEvent } from 'react';

export interface DialogProps extends ReactModal.Props {
  closable?: boolean;
  contentClassName?: string;
  height?: string | number;
  onClose?: (e: MouseEvent<HTMLSpanElement>) => void;
  width?: number;
  isMobile?: boolean;
}

const Dialog = (props: DialogProps) => {
  const currentSize = useWindowSize();

  const {
    bodyOpenClassName,
    children,
    className,
    closable = true,
    closeTimeoutMS = 150,
    contentClassName,
    height,
    isOpen,
    isMobile,
    onClose,
    overlayClassName,
    portalClassName,
    style,
    width,
    ...rest
  } = props;

  const onCloseClick = (e: MouseEvent<HTMLSpanElement>) => {
    onClose?.(e);
  };

  const renderCloseButton = (
    <CloseButton absolute className="top-4.5 ltr:right-6 rtl:left-6" onClick={onCloseClick} />
  );

  const contentStyle = {
    content: {
      // inset: 'unset',
      inset: 0,
      border: 'none',
      background: 'transparent',
      padding: 0,
    },
    ...style,
  };

  if (width !== undefined) {
    contentStyle.content.width = width;

    if (typeof currentSize.width !== 'undefined' && currentSize.width <= width) {
      contentStyle.content.width = 'auto';
    }
  }

  if (height !== undefined) {
    contentStyle.content.height = height;
  }

  const defaultDialogContentClass = 'dialog-content';

  const dialogClass = classNames(defaultDialogContentClass, contentClassName);

  return (
    <Modal
      className={{
        base: classNames('dialog', className as string),
        afterOpen: 'dialog-after-open',
        beforeClose: 'dialog-before-close',
      }}
      overlayClassName={{
        base: classNames('dialog-overlay', overlayClassName as string),
        afterOpen: 'dialog-overlay-after-open',
        beforeClose: 'dialog-overlay-before-close',
      }}
      portalClassName={classNames('dialog-portal', portalClassName)}
      bodyOpenClassName={classNames('dialog-open', bodyOpenClassName)}
      ariaHideApp={false}
      isOpen={isOpen}
      style={{ ...contentStyle }}
      closeTimeoutMS={closeTimeoutMS}
      {...rest}
    >
      <motion.div
        className={dialogClass + ' overflow-y-auto'}
        style={{ maxHeight: isMobile ? '100dvh' : 'calc(100dvh - 4rem)' }}
        initial={{ transform: 'scale(0.9)' }}
        animate={{
          transform: isOpen ? 'scale(1)' : 'scale(0.9)',
        }}
      >
        {closable && renderCloseButton}
        {children}
      </motion.div>
    </Modal>
  );
};

Dialog.displayName = 'Dialog';

export default Dialog;

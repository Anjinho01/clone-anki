/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {
  forwardRef,
  useState,
  useImperativeHandle,
  useRef,
  useCallback,
  cloneElement,
  createRef,
} from 'react';
import classNames from 'classnames';
import chainedFunction from '../utils/chainedFunction';
import { motion } from 'framer-motion';
import { getPlacementTransition } from './transition';
import { PLACEMENT } from '../utils/constants';
import { createRoot } from 'react-dom/client';
import type {
  DetailedReactHTMLElement,
  RefObject,
  ReactNode,
  ForwardRefExoticComponent,
  RefAttributes,
} from 'react';
import type { NotificationPlacement } from '../@types/placement';

// Reusing ToastProps for common options
export interface ToastProps {
  transitionType?: 'scale' | 'fade';
  placement?: NotificationPlacement | 'top-full' | 'bottom-full';
  offsetX?: string | number;
  offsetY?: string | number;
  block?: boolean;
}

// Props for the wrapper component (no `ref` prop here)
export interface ToastWrapperProps extends ToastProps {
  messageKey: string;
  callback: (ref: HTMLDivElement | null) => void;
  wrapper?: HTMLElement | (() => HTMLElement);
}

// Instance methods exposed via ref
export interface ToastWrapperInstance {
  root: HTMLElement | null;
  push: (message: DetailedReactHTMLElement<any, HTMLDivElement>) => string;
  remove: (key: string) => void;
  removeAll: () => void;
}

type NodeProps = DetailedReactHTMLElement<any, HTMLDivElement>;

type Message = {
  key: string;
  visible: boolean;
  node: NodeProps;
};

// Hook to manage toast messages
const useMessages = (msgKey: string) => {
  const [messages, setMessages] = useState<Message[]>([]);

  const getKey = useCallback(
    (key?: string) => {
      if (!key && messages.length) {
        return messages[messages.length - 1].key;
      }
      return key as string;
    },
    [messages]
  );

  const push = useCallback(
    (message: NodeProps) => {
      const key = msgKey || '_' + Math.random().toString(36).substr(2, 12);
      setMessages((prev) => [...prev, { key, visible: true, node: message }]);
      return key;
    },
    [msgKey]
  );

  const removeAll = useCallback(() => {
    setMessages((prev) => prev.map((msg) => ({ ...msg, visible: false })));
    setTimeout(() => setMessages([]), 50);
  }, []);

  const remove = useCallback(
    (key: string) => {
      setMessages((prev) =>
        prev.map((elm) => (elm.key === getKey(key) ? { ...elm, visible: false } : elm))
      );
      setTimeout(() => setMessages((prev) => prev.filter((msg) => msg.visible)), 50);
    },
    [getKey]
  );

  return { messages, push, removeAll, remove };
};

// Extend the forwarded component type to include getInstance
interface ToastWrapperComponentType extends ForwardRefExoticComponent<
  ToastWrapperProps & RefAttributes<ToastWrapperInstance>
> {
  getInstance: (
    props: ToastWrapperProps
  ) => Promise<[RefObject<ToastWrapperInstance | null>, () => void]>;
}

// ForwardRef component
export const ToastWrapper = forwardRef<ToastWrapperInstance, ToastWrapperProps>(
  (
    {
      transitionType = 'scale',
      placement = PLACEMENT.TOP_END as NotificationPlacement,
      offsetX = 30,
      offsetY = 30,
      messageKey,
      block = false,
      callback,

      wrapper: _wrapper,
      ...rest
    },
    ref
  ) => {
    const rootRef = useRef<HTMLDivElement | null>(null);
    const { push, removeAll, remove, messages } = useMessages(messageKey);

    useImperativeHandle(ref, () => ({
      root: rootRef.current,
      push,
      remove,
      removeAll,
    }));

    const placementTransition = getPlacementTransition({
      offsetX,
      offsetY,
      placement: placement as NotificationPlacement,
      transitionType,
    });

    const toastProps = { triggerByToast: true, ...rest };

    const messageElements = messages.map((item) => (
      <motion.div
        key={item.key}
        className="toast-wrapper"
        initial={placementTransition.variants.initial}
        variants={placementTransition.variants}
        animate={item.visible ? 'animate' : 'exit'}
        transition={{ duration: 0.15, type: 'tween' }}
      >
        {cloneElement(item.node, {
          ...toastProps,
          ref,
          onClose: chainedFunction(item.node.props.onClose, () => remove(item.key)),
          className: classNames(item.node.props.className),
        })}
      </motion.div>
    ));

    return (
      <div
        style={placementTransition.default}
        {...rest}
        ref={(el) => {
          rootRef.current = el;
          callback?.(el);
        }}
        className={classNames('toast', block && 'w-full')}
      >
        {messageElements}
      </div>
    );
  }
) as ToastWrapperComponentType;

// Attach static method after casting
ToastWrapper.getInstance = (props: ToastWrapperProps) => {
  const { wrapper, ...rest } = props;
  const wrapperRef: RefObject<ToastWrapperInstance | null> = createRef();
  const container = (typeof wrapper === 'function' ? wrapper() : wrapper) || document.body;

  return new Promise<[RefObject<ToastWrapperInstance | null>, () => void]>((resolve) => {
    const renderCallback = () => {
      resolve([wrapperRef, unmount]);
    };

    function renderElement(element: ReactNode) {
      const mountEl = document.createElement('div');
      container.appendChild(mountEl);
      const root = createRoot(mountEl);
      root.render(element);
      return root;
    }

    const root = renderElement(
      <ToastWrapper {...rest} ref={wrapperRef} callback={renderCallback} />
    );
    const unmount = () => root.unmount();
  });
};

export default ToastWrapper;

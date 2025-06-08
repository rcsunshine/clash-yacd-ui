import cx from 'clsx';
import * as React from 'react';

import s0 from './Button.module.scss';
import { LoadingDot } from './shared/Basic';

const { forwardRef, useCallback } = React;

type ButtonInternalProps = {
  children?: React.ReactNode;
  label?: string;
  text?: string;
  start?: React.ReactNode | (() => React.ReactNode);
};

type ButtonProps = {
  isLoading?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => unknown;
  disabled?: boolean;
  kind?: 'primary' | 'minimal' | 'circular';
  className?: string;
  title?: string;
} & ButtonInternalProps;

function Button(props: ButtonProps, ref: React.Ref<HTMLButtonElement>) {
  const {
    onClick,
    disabled = false,
    isLoading,
    kind = 'primary',
    className,
    children,
    label,
    text,
    start,
    ...restProps
  } = props;
  const internalProps = { children, label, text, start };
  const internalOnClick = useCallback<React.MouseEventHandler<HTMLButtonElement>>(
    (e) => {
      if (isLoading) return;
      onClick && onClick(e);
    },
    [isLoading, onClick],
  );
  
  // Map kind to Tabler button classes
  const getTablerButtonClass = () => {
    switch (kind) {
      case 'primary':
        return 'btn btn-primary tabler-btn';
      case 'minimal':
        return 'btn btn-ghost-secondary tabler-btn';
      case 'circular':
        return 'btn btn-icon btn-primary tabler-btn rounded-circle';
      default:
        return 'btn btn-primary tabler-btn';
    }
  };
  
  const btnClassName = cx(
    getTablerButtonClass(),
    {
      'btn-loading': isLoading,
      'disabled': disabled || isLoading,
    },
    className,
  );
  
  return (
    <button
      className={btnClassName}
      ref={ref}
      onClick={internalOnClick}
      disabled={disabled || isLoading}
      {...restProps}
    >
      {isLoading ? (
        <>
          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
          <span className="visually-hidden">Loading...</span>
          <ButtonInternal {...internalProps} />
        </>
      ) : (
        <ButtonInternal {...internalProps} />
      )}
    </button>
  );
}

function ButtonInternal({ children, label, text, start }: ButtonInternalProps) {
  return (
    <>
      {start ? (
        <span className="me-2 d-inline-flex align-items-center">
          {typeof start === 'function' ? start() : start}
        </span>
      ) : null}
      {children || label || text}
    </>
  );
}

export default forwardRef(Button);

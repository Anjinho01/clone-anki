import classNames from 'classnames';
import Button from '../Button';

export interface DialogActionsProps {
  /** Ative o comportamento full-screen/sticky no mobile */
  isMobile?: boolean;
  /** Mantém o footer grudado no rodapé no mobile (default: true) */
  sticky?: boolean;
  /** Alinhamento dos botões */
  align?: 'left' | 'center' | 'right';
  /** Texto do botão confirmar (default: "Confirmar") */
  confirmText?: string;
  /** Texto do botão cancelar (default: "Cancelar") */
  cancelText?: string;
  /** Tipo do botão confirmar (default: "submit") */
  confirmType?: 'button' | 'submit';
  /** Loading do confirmar */
  loading?: boolean;
  /** Desabilita o confirmar */
  disabled?: boolean;
  /** Handlers */
  onCancel?: () => void;
  onConfirm?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  /** Customização */
  className?: string;
  style?: React.CSSProperties;
  /** Se você passar children, eles substituem os botões padrão */
  children?: React.ReactNode;
}

const DialogActions: React.FC<DialogActionsProps> = ({
  isMobile,
  sticky = true,
  align = 'right',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  confirmType = 'submit',
  loading,
  disabled,
  onCancel,
  onConfirm,
  className,
  style,
  children,
}) => {
  const justify =
    align === 'left' ? 'justify-start' : align === 'center' ? 'justify-center' : 'justify-end';

  const containerClass = classNames(
    'px-6 py-3 bg-gray-100 dark:bg-gray-700 rounded-bl-lg rounded-br-lg',
    'flex gap-2', // layout dos botões
    justify,
    // fixa no rodapé somente no mobile
    { 'sticky bottom-0 left-0 w-full z-10': isMobile && sticky },
    className
  );

  const mergedStyle: React.CSSProperties = {
    // evita que o iOS “coma” o footer (safe area)
    paddingBottom: 'max(env(safe-area-inset-bottom), 0.75rem)',
    ...style,
  };

  return (
    <div className={containerClass} style={mergedStyle} role="group" data-dialog-actions>
      {children ?? (
        <>
          <Button type="button" className="ltr:mr-2 rtl:ml-2" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button
            variant="solid"
            type={confirmType}
            loading={loading}
            disabled={disabled}
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </>
      )}
    </div>
  );
};

export default DialogActions;

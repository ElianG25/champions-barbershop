export function ModalFooter({
  onCancel,
  onConfirm,
  confirmText,
  cancelText = 'Cancelar',
  disabled,
  danger = false,
}: {
  onCancel: () => void
  onConfirm: () => void
  confirmText: string
  cancelText?: string
  disabled?: boolean
  danger?: boolean
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <button onClick={onCancel} className="btn-secondary">
        {cancelText}
      </button>

      <button
        onClick={onConfirm}
        disabled={disabled}
        className={`${danger ? 'btn-danger' : 'btn-primary'} disabled:opacity-50`}
      >
        {confirmText}
      </button>
    </div>
  )
}
'use client'

import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'

export type AppDialogState =
  | {
      type: 'notice'
      title: string
      message?: string
      tone?: 'success' | 'danger' | 'info'
    }
  | {
      type: 'confirm'
      title: string
      message?: string
      tone?: 'danger' | 'info'
      onConfirm: () => void | Promise<void>
    }

export function AppDialog({
  dialog,
  onClose,
}: {
  dialog: AppDialogState
  onClose: () => void
}) {
  async function handleConfirm() {
    if (dialog.type === 'confirm') {
      await dialog.onConfirm()
    }

    onClose()
  }

  const Icon =
    dialog.tone === 'danger'
      ? AlertTriangle
      : dialog.tone === 'success'
        ? CheckCircle2
        : Info

  return (
    <div className="admin-modal-backdrop z-[10000]">
      <section className="admin-modal sm:max-w-md">
        <div className="flex items-start justify-between gap-5">
          <div className="flex gap-4">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center border ${
                dialog.tone === 'danger'
                  ? 'border-red-400/30 text-red-300'
                  : 'border-[var(--brand)] text-[var(--brand)]'
              }`}
            >
              <Icon size={20} />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--brand)]">
                {dialog.type === 'confirm' ? 'Confirmación' : 'Aviso'}
              </p>

              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em]">
                {dialog.title}
              </h2>

              {dialog.message && (
                <p className="mt-3 text-sm leading-6 text-[var(--app-muted)]">
                  {dialog.message}
                </p>
              )}
            </div>
          </div>

          <button onClick={onClose} className="btn-secondary px-3 py-2">
            <X size={16} />
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {dialog.type === 'confirm' && (
            <button onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
          )}

          <button
            onClick={dialog.type === 'confirm' ? handleConfirm : onClose}
            className={dialog.tone === 'danger' ? 'btn-danger' : 'btn-primary'}
          >
            {dialog.type === 'confirm' ? 'Confirmar' : 'Entendido'}
          </button>
        </div>
      </section>
    </div>
  )
}
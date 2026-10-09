import { useCallback, useState } from 'react'
import PasswordConfirmModal from '../components/common/PasswordConfirmModal'

/**
 * Gates a sensitive/action call behind the signed-in account's password.
 *
 * confirm(execute, options) opens the prompt and resolves true once execute
 * succeeds, or false if the user cancels. A wrong password keeps the dialog
 * open for a retry and never executes the action.
 */
export function usePasswordConfirm() {
  const [pending, setPending] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const confirm = useCallback((execute, options = {}) => {
    return new Promise((resolve) => {
      setPending({ execute, resolve, ...options })
      setBusy(false)
      setError('')
    })
  }, [])

  const finish = useCallback((pendingRequest, result) => {
    pendingRequest?.resolve(result)
    setPending(null)
    setBusy(false)
    setError('')
  }, [])

  const submit = useCallback(
    async (password) => {
      if (!pending) return
      setBusy(true)
      setError('')
      try {
        await pending.execute(password)
        finish(pending, true)
      } catch (err) {
        // Keep the prompt open so a typo does not abort the action
        setError(err.message || 'Password verification failed.')
        setBusy(false)
      }
    },
    [pending, finish],
  )

  const dialog = pending ? (
    <PasswordConfirmModal
      open
      title={pending.title}
      description={pending.description}
      confirmLabel={pending.confirmLabel}
      busy={busy}
      error={error}
      onCancel={() => finish(pending, false)}
      onSubmit={submit}
    />
  ) : null

  return { confirm, dialog }
}

export default usePasswordConfirm

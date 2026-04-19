import { flushSync } from 'react-dom'

type DocWithVT = Document & {
  startViewTransition?: (cb: () => void) => unknown
}

export const withViewTransition = (update: () => void): void => {
  const doc = document as DocWithVT
  if (typeof doc.startViewTransition === 'function') {
    doc.startViewTransition(() => {
      // flushSync ensures React commits synchronously before the "after"
      // snapshot is captured. Without it, React 18/19 may batch across the
      // callback boundary and produce a stale snapshot.
      flushSync(update)
    })
  } else {
    update()
  }
}

const KEY = 'bloom-coffee:v1'

export const saveParams = (params: URLSearchParams): void => {
  try {
    localStorage.setItem(KEY, params.toString())
  } catch {
    // storage unavailable (private mode, quota exceeded) — drop silently.
  }
}

export const loadParams = (): URLSearchParams | null => {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? new URLSearchParams(raw) : null
  } catch {
    return null
  }
}

export const clearParams = (): void => {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // noop
  }
}

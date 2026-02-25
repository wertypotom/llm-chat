const ACTIVE_KEY = 'chat:activeId'
const USER_ID_KEY = 'chat:userId' // Local key to establish a consistent pseudo-user for the web

export function getUserId(): string {
  if (typeof window === 'undefined') return 'server'
  let userId = localStorage.getItem(USER_ID_KEY)
  if (!userId) {
    userId = crypto.randomUUID()
    localStorage.setItem(USER_ID_KEY, userId)
  }
  return userId
}

export function loadActiveId(): string | null {
  return localStorage.getItem(ACTIVE_KEY)
}

export function saveActiveId(id: string): void {
  localStorage.setItem(ACTIVE_KEY, id)
}

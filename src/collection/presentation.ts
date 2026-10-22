export type CollectionTheme = 'pearl' | 'midnight'
export const COLLECTION_THEME_KEY = 'lumemon.collection-theme.v1'
export function readCollectionTheme(storage: Pick<Storage, 'getItem'>): CollectionTheme {
  try {
    return storage.getItem(COLLECTION_THEME_KEY) === 'midnight' ? 'midnight' : 'pearl'
  } catch {
    return 'pearl'
  }
}
export function saveCollectionTheme(
  storage: Pick<Storage, 'setItem'>,
  theme: CollectionTheme,
): boolean {
  try {
    storage.setItem(COLLECTION_THEME_KEY, theme)
    return true
  } catch {
    return false
  }
}
export type RevealState = { phase: 'sealed' | 'cards' | 'summary'; visible: number }
export function revealStep(
  state: RevealState,
  action: 'open' | 'next' | 'all',
  total: number,
): RevealState {
  if (total < 1 || action === 'all') return { phase: 'summary', visible: total }
  if (state.phase === 'sealed') return action === 'open' ? { phase: 'cards', visible: 1 } : state
  if (state.phase === 'summary' || action === 'open') return state
  return state.visible < total
    ? { phase: 'cards', visible: state.visible + 1 }
    : { phase: 'summary', visible: total }
}
export function completedTear(dx: number, dy: number, width: number): boolean {
  return Math.abs(dx) >= Math.max(50, width * 0.35) && Math.abs(dy) < 50
}

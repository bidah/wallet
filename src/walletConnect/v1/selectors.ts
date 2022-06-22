import { RootState } from 'src/redux/reducers'

export function selectSessions(state: RootState) {
  return {
    pending: state.walletConnect.v1.pendingSessions,
    sessions: state.walletConnect.v1.sessions,
  }
}

export function selectSessionFromPeerId(peerId: string) {
  return function (state: RootState) {
    return state.walletConnect.v1.sessions.find((session) => session.peerId === peerId)
  }
}

export function selectPendingActions(state: RootState) {
  return state.walletConnect.v1.pendingActions
}

export function selectHasPendingState(state: RootState) {
  return (
    state.walletConnect.v1.pendingSessions.length > 0 ||
    state.walletConnect.v1.pendingActions.length > 0
  )
}

export const walletConnectDisplayedInfoSelector = (state: RootState) =>
  state.walletConnect.v1.walletConnectDisplayedInfo

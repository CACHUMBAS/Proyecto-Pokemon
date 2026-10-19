export function createRecoveryGate() {
  let recoveryUser: string | null = null
  return {
    onEvent(event: string, userId: string | null) {
      if (event === 'PASSWORD_RECOVERY') recoveryUser = userId
      else if (event === 'SIGNED_OUT' || event === 'USER_UPDATED' || userId !== recoveryUser)
        recoveryUser = null
    },
    allows: (userId: string) => recoveryUser === userId,
  }
}

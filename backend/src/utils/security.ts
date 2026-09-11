const revokedTokens = new Set<string>();
const disabledFallbackUsers = new Set<number>();

export const revokeToken = (token: string) => revokedTokens.add(token);
export const isTokenRevoked = (token: string) => revokedTokens.has(token);
export const disableFallbackUser = (id: number) => disabledFallbackUsers.add(id);
export const isFallbackUserDisabled = (id: number) => disabledFallbackUsers.has(id);

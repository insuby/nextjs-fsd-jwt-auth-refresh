/**
 * Thrown when the user's session cannot be recovered (no refresh token, refresh
 * failed, or still unauthorized after a refresh). Callers should treat this as
 * "log out + redirect to /login".
 */
export class SessionExpiredError extends Error {
  constructor(message = 'Session expired') {
    super(message);
    this.name = 'SessionExpiredError';
  }
}

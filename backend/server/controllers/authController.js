import { buildToken, resolveAuthenticatedUser, resolveGoogleProfile } from '../services/authService.js';

export async function googleLogin(req, res, next) {
  try {
    const profile = resolveGoogleProfile(req.body);
    const user = await resolveAuthenticatedUser(profile);
    const token = buildToken(user);
    res.json({ user, token, provider: 'google', expiresIn: '8h' });
  } catch (error) {
    next(error);
  }
}

export function googleCallback(_req, res) {
  res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}${process.env.CLIENT_LOGIN_ROUTE || '/login'}`);
}

export function logout(_req, res) {
  res.json({ message: 'Signed out successfully.' });
}

export function me(req, res) {
  res.json({ user: req.user });
}

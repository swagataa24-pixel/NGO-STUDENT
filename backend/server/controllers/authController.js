import { buildToken, resolveAuthenticatedUser, resolveGoogleProfile, signupWithPassword, signinWithPassword } from '../services/authService.js';

export async function googleLogin(req, res, next) {
  try {
    const profile = resolveGoogleProfile(req.body);
    const user    = await resolveAuthenticatedUser(profile);
    const token   = buildToken(user);
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

export async function signup(req, res, next) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }
    const user  = await signupWithPassword({ name, email, password });
    const token = buildToken(user);
    res.status(201).json({ user, token, expiresIn: '8h' });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    next(error);
  }
}

export async function signin(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }
    const user  = await signinWithPassword({ email, password });
    const token = buildToken(user);
    res.json({ user, token, expiresIn: '8h' });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    next(error);
  }
}

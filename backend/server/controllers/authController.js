import { exchangeOneTimeAuthCode } from '../services/authService.js';

export async function exchange(req, res, next) {
  try {
    res.json(await exchangeOneTimeAuthCode(req.body?.code));
  } catch (error) {
    next(error);
  }
}

export function logout(_req, res) {
  res.json({ message: 'Signed out successfully.' });
}

export function me(req, res) {
  res.json({ user: req.user });
}

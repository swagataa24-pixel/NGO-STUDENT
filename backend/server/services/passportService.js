import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import '../config/env.js';
import { resolveAuthenticatedUser } from './authService.js';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || 'missing-google-client-id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'missing-google-client-secret',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/auth/google/callback',
      state: true
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const user = await resolveAuthenticatedUser({
          name: profile.displayName,
          email: profile.emails?.[0]?.value || '',
          avatar: profile.photos?.[0]?.value || '',
          googleId: profile.id
        });

        done(null, user);
      } catch (error) {
        done(error);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

export { passport };

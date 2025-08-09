const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

/**
 * Configure passport with a single hardcoded user based on environment variables.
 *
 * @param {import('passport').PassportStatic} passport
 */
exports.configurePassport = function configurePassport(passport) {
  const adminUser = {
    id: 'admin',
    username: process.env.ADMIN_USER || 'admin',
    passwordHash: process.env.ADMIN_PASS || '',
  };

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        if (username !== adminUser.username) {
          return done(null, false, { message: 'Incorrect username.' });
        }
        if (!adminUser.passwordHash) {
          return done(null, false, { message: 'Password not configured.' });
        }
        const match = await bcrypt.compare(password, adminUser.passwordHash);
        if (!match) {
          return done(null, false, { message: 'Incorrect password.' });
        }
        return done(null, adminUser);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    if (id === adminUser.id) {
      done(null, adminUser);
    } else {
      done(null, false);
    }
  });
};

require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const { configurePassport } = require('./auth');

const app = express();

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'development_secret',
    resave: false,
    saveUninitialized: false,
  })
);

// Passport configuration
configurePassport(passport);
app.use(passport.initialize());
app.use(passport.session());

// Authentication routes
app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

app.post(
  '/login',
  passport.authenticate('local', {
    failureRedirect: '/login',
  }),
  (req, res) => {
    res.redirect('/dashboard');
  }
);

app.post('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect('/login');
  });
});

// Middleware to ensure authentication
function ensureAuth(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

// Mount protected routes
app.use('/dashboard', ensureAuth, require('./routes/dashboard'));
app.use('/files', ensureAuth, require('./routes/files'));

// Root route
app.get('/', (req, res) => {
  res.redirect('/dashboard');
});

// 404 handler
app.use((req, res) => {
  res.status(404).send('Not found');
});

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

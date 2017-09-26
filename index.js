const express = require('express');

const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const methodOverride = require('method-override');
const moment = require('moment');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 8080;

app.set('view engine', 'ejs');

// data-storing objects
const urlDatabase = [
  {
    shortLink: 'b2xVn2',
    fullLink: 'http://www.lighthouselabs.ca',
    owner: 'userRandomID',
    visits: [],
    created: 'Wednesday, September 13th 2017, 9:34:44 pm',
  },
  {
    shortLink: 'tgm5xK',
    fullLink: 'http://www.google.com',
    owner: 'user2RandomID',
    visits: [],
    created: 'Wednesday, September 13th 2017, 9:34:44 pm',
  },
  {
    shortLink: 'abc123',
    fullLink: 'http://www.example.com',
    owner: 'jonjon',
    visits: [{
      visitor: 'visitor1',
      time: 'Wednesday, September 13th 2017, 9:34:44 pm',
    },
    {
      visitor: 'visitor1',
      time: 'Thursday, September 14th 2017, 2:21:05 am',
    },
    {
      visitor: 'visitor2',
      time: 'Thursday, September 14th 2017, 5:28:19 am',
    },
    ],
    created: 'Wednesday, September 13th 2017, 9:34:44 pm',
  },
];

const linkVisitors = [];

const users = [
  {
    id: 'userRandomID',
    email: 'user@example.com',
    password: 'purple-monkey-dinosaur',
  },
  {
    id: 'user2RandomID',
    email: 'user2@example.com',
    password: 'dishwasher-funk',
  },
  {
    id: 'jonjon',
    email: 'jon@jon.com',
    password: 'jon',
  },
];


// helper functions

function checkAuth(req, res, next) {
  if (!req.session.user_id) {
    res.render('no-auth');
  } else {
    next();
  }
}

function matchAuth(req, res, next) {
  if (!req.session.user_id === urlDatabase.find(url => url.shortLink === req.params.id).owner) {
    res.statusCode = 401;
    res.render('wrong-user');
  } else {
    next();
  }
}

function checkURL(req, res, next) {
  if (!urlDatabase.find(url => url.shortLink === req.params.id)) {
    res.statusCode = 404;
    res.render('unknown-url');
  } else {
    next();
  }
}
function findUserByEmail(enteredEmail) {
  let userID;
  for (const user in users) { // eslint-disable-line no-prototype-buildtins
    if (users.hasOwnProperty(user)) {
      if (users[user].email === enteredEmail) {
        userID = user;
      }
    }
  }
  if (userID) {
    return userID;
  }
  return false;
}

function findUserIdByEmail(email) {
  return (Object.values(users).find(user => user.email === email) || {}).id;
}

function getUrlsForUser(id) {
  const filteredUrs = urlDatabase.filter(urlObject => urlObject.owner === id);
  return filteredUrs;
}

function countUniqueVisitors(link) {
  const linkObject = urlDatabase.find(item => item.shortLink === link);
  const uniqueVisitors = [];
  linkObject.visits.forEach((visit) => {
    if (!uniqueVisitors.includes(visit.visitor)) {
      uniqueVisitors.push(visit.visitor);
    }
  });
  return uniqueVisitors.length;
}

function generateRandomString(database) {
  let str = '';
  const strLength = 6;
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < strLength; i += 1) {
    str += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }

  if (database[str]) {
    return generateRandomString();
  }
  return str;
}

function returnRandomString(database) {
  return generateRandomString(database);
}

function saveLink(link) {
  if (link.includes('http://')) {
    return link;
  }
  return `http://${link}`;
}

for (const user in users) {
  users[user].password = bcrypt.hashSync(users[user].password, 10);
}


app.use(bodyParser.urlencoded({ extended: true }));

app.use(methodOverride('_method'));

app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
}));

// pass login cookie and urlDatabase to templates using local variables
app.use((req, res, next) => {
  const userID = req.session.user_id;
  res.locals = {
    urlsForUser: getUrlsForUser(userID),
    user: users.find(user => user.id === userID),
  };
  next();
});


app.get('/', (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

// access registration page
app.get('/register', (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    res.render('register');
  }
});

// register new user
app.post('/register', (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    const newEmail = req.body.email;
    const newPassword = req.body.password;
    if (newEmail === '' || newPassword === '') {
      res.statusCode = 400;
      res.render('field-empty');
    } else if (findUserByEmail(newEmail)) {
      res.statusCode = 400;
      res.render('email-taken');
    } else {
      const newID = returnRandomString(users);
      users[newID] = {
        id: newID,
        email: newEmail,
        password: bcrypt.hashSync(newPassword, 10),
      };
      req.session.user_id = newID;
      res.redirect('/urls');
    }
  }
});

// access login page
app.get('/login', (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    res.render('login');
  }
});

// log in
app.post('/login', (req, res) => {
  const emailEntered = req.body.email;
  const idFound = findUserByEmail(emailEntered);
  const pwEntered = req.body.password;
  if (idFound &&
    (bcrypt.compareSync(pwEntered, users[idFound].password))
  ) {
    req.session.user_id = idFound;
    res.redirect('/urls');
  } else {
    res.statusCode = 400;
    res.render('wrong-login');
  }
});

// log out
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

// access url-creation page
app.get('/urls/new', checkAuth, (req, res) => {
  if (req.session.user_id &&
      users[req.session.user_id]
  ) {
    res.render('urls_new');
  } else {
    res.redirect('/login');
  }
});

// access url edit page
app.get('/urls/:id', checkURL, checkAuth, matchAuth, (req, res) => {
  res.render('urls_show', {
    link: req.params.id,
    linkObject: urlDatabase.find(url => url.shortLink === req.params.id),
    unique: countUniqueVisitors(req.params.id),
  });
});

// save url edits
app.put('/urls/:id', checkAuth, matchAuth, (req, res) => {
  urlDatabase.find(url => url.shortLink === req.params.id).fullLink = saveLink(req.body.longURL);
  res.redirect('/urls');
});

// delete url
app.delete('/urls/:id', checkAuth, matchAuth, (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});


// urls index page
app.get('/urls', checkAuth, (req, res) => {
  const uniqueVisits = res.locals.urlsForUser.map(url => countUniqueVisitors(url.shortLink));
  res.render('urls_index', {
    uniqueVisits,
  });
});

// create url
app.post('/urls', checkAuth, (req, res) => {
  if (!req.body.longURL) {
    res.end('Invalid input');
  } else {
    const newLink = returnRandomString(urlDatabase);
    urlDatabase[newLink] = {
      fullLink: saveLink(req.body.longURL),
      owner: req.session.user_id,
      visits: [],
      created: moment().utcOffset('-07:00').format('dddd, MMMM Do YYYY, h:mm:ss a'),
    };
    res.redirect(302, `/urls/${newLink}`);
  }
});

// redirect short urls to long ones
app.get('/u/:id', checkURL, (req, res) => {
  const shortlink = req.params.id;
  if (!urlDatabase[shortlink]) {
    res.render('unknown-url');
  } else {
    // create new visitor ID if it's not there
    if (!req.session.visitor_id) {
      req.session.visitor_id = generateRandomString(linkVisitors);
      linkVisitors[req.session.visitor_id] = 0;
    }

    // add 1 do visitor id session count
    linkVisitors[req.session.visitor_id] += 1;

    // push session info into urlDatabase
    const longURL = urlDatabase[shortlink].fullLink;
    urlDatabase[shortlink].visits.push({
      visitor: req.session.visitor_id, time: moment().utcOffset('-07:00').format('dddd, MMMM Do YYYY, h:mm:ss a'),
    });
    res.redirect(longURL);
  }
});

// make url data available as JSOn
app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});


app.listen(PORT, () => {
  console.log(`Tiny App listening on port ${PORT}!`);
});

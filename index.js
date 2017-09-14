var express = require("express");

const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const methodOverride = require('method-override');
const moment = require('moment');
const bodyParser = require("body-parser");

var app = express();
var PORT = process.env.PORT || 8080;

app.set("view engine", "ejs");

// data-storing objects
const urlDatabase = {
  "b2xVn2": {
    fullLink: "http://www.lighthouselabs.ca", 
    owner: "userRandomID",
    visits: []
  },
   "9sm5xK": {
    fullLink: "http://www.google.com", 
    owner: "user2RandomID",
    visits: []
  },
  "123abc": {fullLink: "http://www.canada.com", 
    owner: "jonjon",
    visits: [{
              visitor: "visitor1",
              time: "Wednesday, September 13th 2017, 9:34:44 pm"
              },
              {
                visitor: "visitor1",
                time: "Thursday, September 14th 2017, 2:21:05 am"
              },
              {
                visitor: "visitor2",
                time: "Thursday, September 14th 2017, 5:28:19 am"
              },
    ]
  }
};

const linkVisitors = {};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  },
  "jonjon": {
    id: "jonjon", 
    email: "jon@jon.com", 
    password: "jon"
  }
}

// helper functions
function findUserByEmail(enteredEmail){
  var userID;
  for (user in users){
    if (users[user].email === enteredEmail){
      userID = user;
    }
  }
  if (userID){
    return userID;
  } else {
    return false;
  }
}

function urlsForUser(id){
  var filteredUrs = {};
  for (let link in urlDatabase){
    if (urlDatabase[link].owner == id){
      filteredUrs[link] = urlDatabase[link];
    }
  }
  return filteredUrs;
}

function countUniqueVisitors(link){
  const uniqueVisitors = [];
  for (visit of urlDatabase[link].visits){
    if (!uniqueVisitors.includes(visit['visitor'])) {
      uniqueVisitors.push(visit['visitor']);
    }
  }
  return uniqueVisitors.length;
}

function generateRandomString(database) {
  let str = "";
  const strLength = 6;
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < strLength; i++) {
    str += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  
  if (database[str]){
    return generateRandomString();
  } else {
    return str;
  }
}

function returnRandomString(database){
  return generateRandomString(database);
}

function entrypt(pw){
  return bcrypt.hashSync(pw, 10);
}

function saveLink(link){
  if (link.includes("http://")){
   return link;
  } else {
    return "http://" + link;
  }
}

for (let user in users){
  users[user].password = bcrypt.hashSync(users[user].password, 10);
}


app.use(bodyParser.urlencoded({extended: true}));

app.use(methodOverride('_method'));

app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}))

//pass login cookie and urlDatabase to templates using local variables
app.use(function (request, response, next) {
  const userID = request.session.user_id
  response.locals = {
    urlDatabase: urlsForUser(userID), 
    user: users[userID]
  };
  next();
});


app.get("/", (req, res) => {
  res.redirect("/urls");
});

// access registration page
app.get("/register", (req, res) => {
  res.render("register");
});

// register new user
app.post("/register", (req, res) => {
  let newEmail = req.body.email;
  let newPassword = req.body.password;
  if (newEmail == '' || newPassword == '') {
    res.statusCode = 400;
    res.end("email or password field empty");
  } else if (findUserByEmail(newEmail)) {
    res.statusCode = 400;
    res.end("Email already in use");
  }

  else {
  let newID = returnRandomString(users);
  users[newID] = {
    id: newID, 
    email: newEmail, 
    password: bcrypt.hashSync(newPassword, 10)  
  };
  req.session.user_id = newID;
  res.redirect("/urls");
  }
});

// access login page
app.get("/login", (req, res) => {
  res.render("login");
});

// log in
app.post("/login", (req, res) => {
  let emailEntered = req.body.email;
  let idFound = findUserByEmail(emailEntered);
  let pwEntered = req.body.password;
  if ( idFound && 
    ( bcrypt.compareSync(pwEntered, users[idFound].password))
    ){
    req.session.user_id = idFound;
    res.redirect("/urls");
  } else {
    res.statusCode = 400;
    res.end("Incorrect username or password")
  }
});

// log out
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");  
});

// access link-creation page
app.get("/urls/new", (req, res) => {
  if (req.session.user_id &&
      users[req.session.user_id]
      ){
    res.render("urls_new");
  } else {
    res.redirect("/login");
  }
});

// access link edit page
app.get("/urls/:id", (req, res) => {
  if (req.session.user_id === urlDatabase[req.params.id].owner) {
    res.render("urls_show", {
      link: req.params.id,
      linkObject: urlDatabase[req.params.id],
      unique: countUniqueVisitors(req.params.id)
    });
  } else {
    res.end("only link owner can edit")
  }
});



// save link edits
app.put("/urls/:id", (req, res) => {
  urlDatabase[req.params.id].fullLink  = saveLink(req.body.longURL);
  res.redirect("/urls");
}); 

app.delete("/urls/:id", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls")
}); 


app.get("/urls", (req, res) => {
  res.render("urls_index")
});


app.post("/urls", (req, res) => {
  var newLink = returnRandomString(urlDatabase);
  urlDatabase[newLink] = {
    fullLink: saveLink(req.body.longURL), 
    owner: req.session.user_id,
    visits: [] };
  res.redirect(302, "/urls/" + newLink);
});

// redirect short urls to long ones
app.get("/u/:shortURL", (req, res) => {
  const shortlink = req.params.shortURL;
  if (!req.session.visitor_id) {
      req.session.visitor_id = generateRandomString(linkVisitors);
      linkVisitors[req.session.visitor_id] = 0;
  }
  linkVisitors[req.session.visitor_id]++;

  let longURL = urlDatabase[shortlink].fullLink;
  urlDatabase[shortlink].visits.push(
    {
      visitor: req.session.visitor_id, time: moment().utcOffset("-07:00").format("dddd, MMMM Do YYYY, h:mm:ss a")
    }
  );
  res.redirect(longURL);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});




app.listen(PORT, () => {
  console.log(`Tiny App listening on port ${PORT}!`);
});
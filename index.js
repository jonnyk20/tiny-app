var express = require("express");
var cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');

var app = express();
var PORT = process.env.PORT || 8080;

app.set("view engine", "ejs");

var urlDatabase = {
  "b2xVn2": {fullLink: "http://www.lighthouselabs.ca", owner: "userRandomID"},
  "9sm5xK": {fullLink: "http://www.google.com", owner: "user2RandomID"},
  "123abc": {fullLink: "http://www.canada.com", owner: "jonjon"}
};

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

function returnRandomString(database){
  return generateRandomString(database);
}

function generateRandomString(database) {
  var charString = [];
  while (charString.length < 6){
  var min = 48; //0
  var max = 90; // Z
  var num = Math.floor(Math.random() * ((max-min)+1) + min);
  if ( (num >= 48 && num <= 57 ) ||
       (num >= 65 && num <= 90 ) ) {
    // if generated num is alphanumeric
    charString.push(String.fromCharCode(num).toLowerCase());
  }
}
  var output = charString.join("");
  if (database[output]){
    return generateRandomString();
  } else {
    return charString.join("");
  }
}

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.use(cookieParser());

//pass login cookie and urlDatabase to templates using local variables
app.use(function (request, response, next) {
  const userID = request.cookies['user_id']
  response.locals = {
    urlDatabase: urlsForUser(userID), 
    user: users[userID]
  };
  next();
});

app.get("/", (req, res) => {
  res.end("hello :)")
});


app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect("/urls");  
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  let emailEntered = req.body.email;
  let idFound = findUserByEmail(emailEntered);
  let pwEntered = req.body.password;
  if ( idFound && (users[idFound].password === pwEntered)){
    res.cookie('user_id', idFound);
    res.redirect("/urls");
  } else {
    res.statusCode = 400;
    res.end("Incorrect username or password")
  }
});

app.get("/register", (req, res) => {
  res.render("register");
});

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
    password: newPassword   
  };
  res.cookie('user_id', newID);
  res.redirect("/urls");
}
});

app.get("/urls/new", (req, res) => {
  if (req.cookies['user_id'] &&
      users[req.cookies['user_id']]
      ){
    res.render("urls_new");
  } else {
    res.redirect("/login");
  }
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
}); 

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id].fullLink  = req.body.longURL;
  res.redirect("/urls");
}); 

app.get("/urls/:id", (req, res) => {
  if (req.cookies['user_id'] === urlDatabase[req.params.id].owner) {
    res.render("urls_show", {
      urlDatabase: urlDatabase,
      selected: req.params.id
    });
  } else {
    res.end("only link owner can edit")
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  // var filteredUrls = urlsForUser(req.cookies['user_id']);
  res.render("urls_index")
});

app.post("/urls", (req, res) => {
  var newLink = returnRandomString(urlDatabase);
  urlDatabase[newLink] = {fullLink: req.body.longURL, owner: req.cookies['user_id'] };
  res.redirect(302, "/urls/" + newLink);
});


app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL].fullLink;
  res.redirect(longURL);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
var express = require("express");
var cookieParser = require('cookie-parser');

var app = express();
var PORT = process.env.PORT || 8080;

app.set("view engine", "ejs");



var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// let templateVars = {
//   urls: urlDatabase
// };

function newShortlink(){
  return generateRandomString();
}

function generateRandomString() {
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
  if (urlDatabase[output]){
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
  response.locals = {
    username : request.cookies['username'],
    urlDatabase: urlDatabase
  };
  next();
});


app.get("/", (req, res) => {
  res.end("hello :)")
});

app.post("/login", (req, res) => {
  let newUser = req.body.username;
  res.cookie('username', newUser);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie('username');
  res.redirect("/urls");  
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  console.log(urlDatabase);
  res.redirect("/urls");
}); 

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect("/urls");
}); 


app.get("/urls/:id", (req, res) => {
  res.render("urls_show", {
    urlDatabase: urlDatabase,
    selected: req.params.id
  });
});


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  res.render("urls_index")
});

app.post("/urls", (req, res) => {
  var newLink = newShortlink();
  urlDatabase[newLink] = req.body.longURL;
  res.redirect(302, "/urls/" + newLink);
});


app.get("/u/:shortURL", (req, res) => {
  // let longURL = ...
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
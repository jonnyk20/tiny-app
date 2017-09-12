var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080;

app.set("view engine", "ejs");

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

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

app.get("/", (req, res) => {
  res.end("hello :)")
});

app.get("/urls", (req, res) => {
  // let templateVars = { urls: urlDatabase };
  // res.render("urls_index", templateVars);
  res.render("urls_index", {
    urlDatabase: urlDatabase
  })
});



app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.post("/urls", (req, res) => {
  urlDatabase[newShortlink()] = req.body.longURL;
  console.log(urlDatabase);
  console.log(req.body);  // debug statement to see POST parameters
  //res.send("Ok");         // Respond with 'Ok' (we will replace this)
  res.redirect(301, 'http://example.com');
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

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
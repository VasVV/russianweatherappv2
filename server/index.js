/* external imports  */
require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const bp = require("body-parser");
const { resolve, join } = require("path");
const axios = require("axios");
const logger = require("morgan"); /* logs GET/POST requests to console useful in development */

const buildDir = resolve(__dirname, "../weathermapru/build");
const PORT = process.env.PORT || 3001;
const headers = { "X-Yandex-API-Key": process.env.YANDEX_API_KEY };
// app.use(logger("tiny"));
app.use(cors());
app.use("/RussianWeatherApp", express.static(buildDir));

/* Routes */
app.get("/", (req, res) => res.sendFile(join(buildDir, "index.html")));

/* if no route matches */
app.get("*", (req, res) =>
  res.status(404).send("Sorry we couldn't find that page")
);

/* Post */

/* parse application/json */
app.use(bp.json());
/* parse application/x-www-form-urlencoded */
app.use(bp.urlencoded({ extended: false }));

app.post("/recieveweather", (req, res, next) => {
  const { lat, lon } = req.body;
 console.log('latitude',lat);
 console.log('longitude', lon);
 
  /* options for fetch weather */
  if (lat && lon) {
  const requestOptions = {
    method: "GET",
    headers,
    url: `https://api.weather.yandex.ru/v2/forecast?lat=${lat}&lon=${lon}&extra=true`,
    redirect: "follow",
  };

  axios(requestOptions)
    .then(function (response) {
      res.send(response.data);
    })
    .catch(function (error) {
    //   console.log(error);
      next(error);
    });
}
});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
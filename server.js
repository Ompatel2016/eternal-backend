
require("dotenv").config(); // 👈 load .env
const express = require("express");
const cors  = require("cors");
const mongoose = require("mongoose");
const userRoutes = require("./routes/userRoutes");
const Coutryroutes = require("./routes/countryRoutes");
const universityRout = require("./routes/UniversityRout");
const aboutusRoutes = require("./routes/aboutRoutes");
const herosectionRoutes = require("./routes/HeroSectionRoute");
const homeextraroute = require("./routes/HomeSettingRoute");
const BlogPost = require("./routes/blogeRoute");
const GalleryPost = require("./routes/GalleryRoutes");

const app = express();

const dns = require('dns');
dns.setServers(["1.1.1.1","8.8.8.8"])

// Middleware
app.use(cors());
app.use(express.json());


app.use("/api/users", userRoutes);
app.use("/api/coutrys", Coutryroutes);
app.use("/api/university", universityRout);
app.use("/api/about", aboutusRoutes);
app.use("/api/hero-section", herosectionRoutes);
app.use("/api/home-extra/", homeextraroute);
app.use("/api/gallery",GalleryPost);
app.use("/api/Blog",BlogPost);

//mongodb connection
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("Mongodb connected" ))
.catch((err) => console.log("Error: ",err));

// Test Route
app.get("/", (req, res) => {
  res.send("API is running...");
});



// Server Port
const PORT = 5000;

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
require("dotenv").config();

const express = require("express");
const axios = require("axios");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/public", express.static(path.join(__dirname, "public")));

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

const HUBSPOT_BASE = "https://api.hubapi.com";
const HUBSPOT_TOKEN = process.env.HUBSPOT_PRIVATE_APP_TOKEN;
const CUSTOM_OBJECT_TYPE = process.env.HUBSPOT_CUSTOM_OBJECT_TYPE;


const PROPS = {
  petName: "pet_name",
  petType: "pet_type",
  petColor: "pet_color",
};

const PET_COLOR_OPTIONS = [
  { value: "Black", label: "Black" },
  { value: "White", label: "White" },
  { value: "Brown", label: "Brown" },
  { value: "Fawn", label: "Fawn" },
];

// ---------- Axios Client ----------
const hubspot = axios.create({
  baseURL: HUBSPOT_BASE,
  headers: {
    Authorization: `Bearer ${HUBSPOT_TOKEN}`,
    "Content-Type": "application/json",
  },
});

if (!HUBSPOT_TOKEN) throw new Error("Missing HUBSPOT_PRIVATE_APP_TOKEN in .env");
if (!CUSTOM_OBJECT_TYPE) throw new Error("Missing HUBSPOT_CUSTOM_OBJECT_TYPE in .env");

app.get("/", async (req, res) => {
  try {
    const response = await hubspot.get(`/crm/v3/objects/${CUSTOM_OBJECT_TYPE}`, {
      params: {
        limit: 100,
        properties: [PROPS.petName, PROPS.petType, PROPS.petColor].join(","),
      },
    });

    res.render("homepage", {
      title: "Homepage | Integrating With HubSpot I Practicum",
      records: response.data.results || [],
      props: PROPS,
    });
  } catch (err) {
    console.error("GET / error:", err.response?.data || err.message);
    res.status(500).send({
      message: "Error retrieving custom object records",
      details: err.response?.data || err.message,
    });
  }
});

app.get("/update-cobj", (req, res) => {
  res.render("updates", {
    title: "Update Custom Object Form | Integrating With HubSpot I Practicum",
    props: PROPS,
    colors: PET_COLOR_OPTIONS,
  });
});

app.post("/update-cobj", async (req, res) => {
  try {
    const petName = String(req.body[PROPS.petName] || "").trim();
    const petType = String(req.body[PROPS.petType] || "").trim();
    const petColor = String(req.body[PROPS.petColor] || "").trim();

    if (!petName) return res.status(400).send("Pet Name is required.");
    if (!petColor) return res.status(400).send("Pet Color is required.");

    await hubspot.post(`/crm/v3/objects/${CUSTOM_OBJECT_TYPE}`, {
      properties: {
        [PROPS.petName]: petName,
        [PROPS.petType]: petType,
        [PROPS.petColor]: petColor,
      },
    });

    res.redirect("/");
  } catch (err) {
    console.error("POST /update-cobj error:", err.response?.data || err.message);
    res.status(500).send({
      message: "Error creating custom object record",
      details: err.response?.data || err.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

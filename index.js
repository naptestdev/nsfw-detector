const express = require("express");
const app = express();
const axios = require("axios").default;
const nsfw = require("nsfwjs");
require("dotenv/config");
const {
  node: { decodeImage },
} = require("@tensorflow/tfjs-node");

app.use(express.json());

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.post("/", async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).send("Image is required");

    const model = await nsfw.load();

    const pic =
      /^([A-Za-z0-9+\/]{4})*([A-Za-z0-9+\/]{3}=|[A-Za-z0-9+\/]{2}==)?$/gm.test(
        image
      )
        ? Buffer.from(image, "base64")
        : (
          await axios.get(image, {
            responseType: "arraybuffer",
          })
        ).data;

    const tfImage = decodeImage(pic, 3);
    const predictions = await model.classify(tfImage);
    tfImage.dispose();

    res.send(predictions);
  } catch (error) {
    console.log(error);
    if (!res.headersSent) res.sendStatus(500);
  }
});

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Server is listening on port ${port}`));

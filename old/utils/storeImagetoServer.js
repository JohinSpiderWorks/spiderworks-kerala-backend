const axios = require("axios");
const fs = require("fs");

async function storeImageOnServer(url, path) {
  console.log({ url, path });

  try {
    const response = await axios.get(url, {
      method: "GET",
      responseType: "stream",
    });

    const writer = fs.createWriteStream(path);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });
  } catch (error) {
    console.error("Error downloading the image:", error);
    throw error;
  }
}

module.exports = storeImageOnServer;

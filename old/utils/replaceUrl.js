const storeImageOnServer = require("./storeImagetoServer");
const path = require("path");
const regex =
  /http:\/\/localhost:5000\/attachments\/Resources\/([^\s]+)\.(png|jpg|jpeg|gif)/gi;

require("dotenv").config();
const replaceURL = (description) => {
  console.log("First Step");

  // Check if the description is an array
  if (Array.isArray(description)) {
    console.log("Second step");

    // Iterate over each element in the array and apply the replacement
    return description.map((desc) =>
      desc.replace(regex, (match, filePath, ext) => {
        storeImageOnServer(
          `http://localhost:5000/uploads/attachments/resources/${filePath}.${ext}`,
          path.join(
            "",
            "uploads",
            "attachments",
            "resources",
            `${filePath}.${ext}`
          )
        );
        console.log(`File:${filePath}.${ext}`);
        console.log({
          description: `${process.env.BACKEND_URL}/uploads/attachments/resources/${filePath}.${ext}`,
        });

        return `${process.env.BACKEND_URL}/uploads/attachments/resources/${filePath}.${ext}`;
      })
    );
  } else if (typeof description === "string") {
    console.log("Third step");

    // If it's a string with multiple URLs, apply the replacement globally
    return description.replace(regex, (match, filePath, ext) => {
      console.log(
        "fourth",
        `${process.env.BACKEND_URL}/uploads/attachments/resources/${filePath}.${ext}`
      );
      storeImageOnServer(
        `http://localhost:5000/uploads/attachments/resources/${filePath}.${ext}`,
        path.join(
          "",
          "uploads",
          "attachments",
          "resources",
          `${filePath}.${ext}`
        )
      );
      console.log(
        "fifth",
        `${process.env.BACKEND_URL}/uploads/attachments/resources/${filePath}.${ext}`
      );

      return `${process.env.BACKEND_URL}/uploads/attachments/resources/${filePath}.${ext}`;
    });
  } else {
    // If it's neither a string nor an array, return it as-is (or handle accordingly)
    return description;
  }
};

module.exports = replaceURL;

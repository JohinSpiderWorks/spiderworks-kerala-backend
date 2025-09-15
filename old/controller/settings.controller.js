const { validate } = require("email-validator");
const settingsModel = require("../models/settings/settings.model");
const fs = require("fs");
const { passwordStrength } = require("check-password-strength");
const hash = require("../utils/helper");
const getAllSettings = async (req, res) => {
  try {
    const settings = await settingsModel.findAll({
      order: [["createdAt", "ASC"]],
    });
    console.log(settings);
    res.render("settings/index", { title: "Settings", data: settings });
    // res.status(200).json({ data: settings });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

const createSettings = async (req, res) => {
  try {
    const { settingsList } = req.body;
    const parsedSettings = JSON.parse(settingsList);
    console.log(req.body);

    const smtp_email = parsedSettings.find(
      (value) => value.key == "smtp_email"
    );
    const smtp_password = parsedSettings.find(
      (value) => value.key == "smtp_password"
    );
    if (!validate(smtp_email.value)) {
      return res
        .status(400)
        .json({ type: "email", msg: "Please Enter valid Email" });
    }
    if (passwordStrength(smtp_password.value).id < 2) {
      return res
        .status(400)
        .json({ type: "password", msg: "Please Enter Strong Password" });
    }

    // Retrieve the filenames for uploaded files, if they exist
    const logoFilename = req?.files?.logo ? req.files.logo[0].filename : null;
    const faviconFilename = req?.files?.favicon
      ? req.files.favicon[0].filename
      : null;

    for (const settings of parsedSettings) {
      let findKey;
      let oldPic;
      switch (settings.key) {
        case "logo":
          findKey = await settingsModel.findOne({ where: { key: "logo" } });

          if (findKey) {
            // Update logo if a file is uploaded or a new value is provided
            if (logoFilename || settings.value) {
              oldPic = `uploads/assets/${findKey?.dataValues?.value
                ?.split("/")
                ?.pop()}`;
              console.log(oldPic);

              if (fs.existsSync(oldPic)) {
                await fs.promises.unlink(oldPic);
              }
              await settingsModel.update(
                { value: `/uploads/assets/${logoFilename || settings.value}` },
                { where: { key: "logo" } }
              );
            }
          } else {
            // Create logo entry if it does not exist and a file is uploaded
            if (logoFilename || settings.value) {
              await settingsModel.create({
                key: "logo",
                value: `/uploads/assets/${logoFilename || settings.value}`,
              });
            }
          }
          break;

        case "favicon":
          findKey = await settingsModel.findOne({ where: { key: "favicon" } });

          if (findKey) {
            // Update favicon if a file is uploaded or a new value is provided
            if (faviconFilename || settings.value) {
              oldPic = `uploads/assets/${findKey?.dataValues?.value
                ?.split("/")
                ?.pop()}`;
              console.log(oldPic);

              if (fs.existsSync(oldPic)) {
                await fs.promises.unlink(oldPic);
              }
              await settingsModel.update(
                {
                  value: `/uploads/assets/${faviconFilename || settings.value}`,
                },
                { where: { key: "favicon" } }
              );
            }
          } else {
            // Create favicon entry if it does not exist and a file is uploaded
            if (faviconFilename || settings.value) {
              await settingsModel.create({
                key: "favicon",
                value: `/uploads/assets/${faviconFilename || settings.value}`,
              });
            }
          }
          break;

        default:
          findKey = await settingsModel.findOne({
            where: { key: settings.key },
          });

          if (findKey) {
            await settingsModel.update(
              {
                value:
                  settings?.key == "smtp_password"
                    ? await hash(settings?.value)
                    : settings.value,
              },
              { where: { key: settings.key } }
            );
          } else {
            await settingsModel.create({
              key: settings.key,
              value: settings.value,
            });
          }
          break;
      }
    }

    res.status(201).json({ msg: "Settings Created Successfully" });
  } catch (error) {
    console.log(error?.message);
    
    res.status(500).json({ err: error.message });
  }
};

const getSettings = async (req, res) => {
  const { id } = req.params;
  try {
    const findSettings = await settingsModel.findByPk(id);
    if (!findSettings) {
      return res.status(404).json({ err: "Settings not-found" });
    }
    res.status(200).json({ data: findSettings.dataValues });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

const updateSettings = async (req, res) => {
  const { id } = req.params;
  try {
    const findSettings = await settingsModel.findByPk(id);
    if (!findSettings) {
      return res.status(404).json({ err: "Settings not-found" });
    }
    if (req?.file) {
      await settingsModel.update(
        {
          key: req?.body?.key,
          value: req?.file.filename,
        },
        {
          where: {
            id: id,
          },
        }
      );
    } else {
      await settingsModel.update(req?.body, {
        where: {
          id: id,
        },
      });
    }

    res.status(200).json({ msg: "Updated Successfully" });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

const deleteSettings = async (req, res) => {
  const { id } = req.params;

  try {
    const findSettings = await settingsModel.findByPk(id);
    if (!findSettings) {
      return res.status(404).json({ err: "Settings not-found" });
    }
    await findSettings.destroy();
    res.redirect("/admin/settings");
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

module.exports = {
  getAllSettings,
  getSettings,
  createSettings,
  updateSettings,
  deleteSettings,
};

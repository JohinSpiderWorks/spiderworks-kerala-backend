const Author = require("../models/author.model");
const { uploadFile } = require("../utils/fileUpload");

exports.createAuthor = async (req, res) => {
  try {
    let imagePath = null;
    if (req.file) {
      imagePath = `/uploads/${req.file.filename}`;
    }

    const author = await Author.create({
      ...req.body,
      image: imagePath,
    });

    res.status(201).json(author);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllAuthors = async (req, res) => {
  try {
    const authors = await Author.findAll();
    res.status(200).json(authors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAuthorById = async (req, res) => {
  try {
    const author = await Author.findByPk(req.params.id);
    if (!author) {
      return res.status(404).json({ error: "Author not found" });
    }
    res.status(200).json(author);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateAuthor = async (req, res) => {
  try {
    let updateData = { ...req.body };

    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }

    const [updated] = await Author.update(updateData, {
      where: { id: req.params.id },
    });

    if (updated) {
      const updatedAuthor = await Author.findByPk(req.params.id);
      return res.status(200).json(updatedAuthor);
    }
    throw new Error("Author not found");
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteAuthor = async (req, res) => {
  try {
    const deleted = await Author.destroy({
      where: { id: req.params.id },
    });
    if (deleted) {
      return res.status(204).send();
    }
    throw new Error("Author not found");
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

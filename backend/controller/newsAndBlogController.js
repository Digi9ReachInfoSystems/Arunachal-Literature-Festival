import path from "path";
import multer from "multer";
import { Category, NewsAndBlog } from "../models/newsAndBlog.js";
import { saveBufferToLocal, deleteLocalByUrl } from "../utils/fileStorage.js";

const storage = multer.memoryStorage();
const upload = multer({ storage }).single("image_url");

export const addCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "Category name is required" });
    }

    // Check if category already exists
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res
        .status(400)
        .json({ success: false, message: "Category already exists" });
    }
    const category = new Category({ name });
    await category.save();
    res.status(201).json({
      success: true,
      message: "Category added successfully",
      data: category,
    });
  } catch (err) {
    console.error("Error adding category:", err);
    res.status(500).json({ message: "Error adding category" });
  }
};

export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json(categories);
  } catch (err) {
    console.error("Error getting categories:", err);
    res.status(500).json({ message: "Error getting categories" });
  }
};
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!id || !name) {
      return res
        .status(400)
        .json({ success: false, message: "Category id and name are required" });
    }
    const category = await Category.findById(id);
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }
    category.name = name;
    await category.save();
    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (err) {
    console.error("Error updating category:", err);
    res.status(500).json({ message: "Error updating category" });
  }
};
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findByIdAndDelete(id);
    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting category:", err);
    res.status(500).json({ message: "Error deleting category" });
  }
};
export const addNewsAndBlog = async (req, res) => {
  const handleFileUpload = () => {
    return new Promise((resolve, reject) => {
      upload(req, res, (err) => {
        if (err) {
          console.error("Multer error:", err);
          return reject(new Error("File upload failed: " + err.message));
        }
        resolve();
      });
    });
  };
  try {
    await handleFileUpload();

    const { title, contentType, publishedDate, contents, link, category_ref,author } =
      req.body;

    const categoryExists = await Category.findById(category_ref);
    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }
    let newsAndBlog;
    const file = req.file;
    let imageUrl = "";
    if (file) {
      imageUrl = await saveBufferToLocal(file, "NewsAndBlog");
    }
    if (contentType === "link") {
      if (!link) {
        return res.status(400).json({ message: "Link is required for news" });
      }
      newsAndBlog = new NewsAndBlog({
        title,
        contentType,
        publishedDate,
        link,
        image_url: imageUrl,
        category_ref,
      });
    } else if (contentType === "blog") {
      if (!contents) {
        return res
          .status(400)
          .json({ message: "Contents is required for blog" });
      }

      newsAndBlog = new NewsAndBlog({
        title,
        contentType,
        publishedDate,
        contents,
        image_url: imageUrl,
        category_ref,
        author
      });
    } else {
      return res.status(400).json({ message: "Invalid content type" });
    }
    await newsAndBlog.save();

    res.status(201).json(newsAndBlog);
  } catch (error) {
    console.error("Error adding news and blog:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
export const getNewsAndBlog = async (req, res) => {
  try {
    const newsAndBlog = await NewsAndBlog.find();
    res.status(200).json(newsAndBlog);
  } catch (error) {
    console.error("Error getting news and blog:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
export const updateNewsAndBlog = async (req, res) => {
  const handleFileUpload = () => {
    return new Promise((resolve, reject) => {
      upload(req, res, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  };
  try {
    await handleFileUpload();

    const { newsAndBlogId } = req.params;
    const file = req.file;

    const existing = await NewsAndBlog.findById(newsAndBlogId);
    if (!existing) {
      return res.status(404).json({ message: "News and blog not found" });
    }

    let newImageUrl = existing.image_url;

    if (file && file.buffer) {
      if (existing.image_url) {
        await deleteLocalByUrl(existing.image_url);
      }
      newImageUrl = await saveBufferToLocal(file, "NewsAndBlog");
    }

    const updatedNews = await NewsAndBlog.findByIdAndUpdate(
      newsAndBlogId,
      {
        ...req.body,
        image_url: newImageUrl,
      },
      { new: true }
    );

    res.status(200).json({
      message: "News or blog updated successfully",
      updatedNews,
    });
  } catch (error) {
    console.error("Error updating news and blog:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteNewsAndBlog = async (req, res) => {
  try {
    const { newsAndBlogId } = req.params;
    const newsAndBlog = await NewsAndBlog.findById(newsAndBlogId);
    if (!newsAndBlog) {
      return res.status(404).json({ message: "News and blog not found" });
    }
    if (newsAndBlog.image_url) {
      await deleteLocalByUrl(newsAndBlog.image_url);
    }
    await NewsAndBlog.findByIdAndDelete(newsAndBlogId);
    res.status(200).json({ message: "News and blog deleted successfully" });
  } catch (err) {
    console.error("Error deleting news and blog:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getNewsAndBlogById = async (req, res) => {
  try {
    const { newsAndBlogId } = req.params;
    const newsAndBlog = await NewsAndBlog.findById(newsAndBlogId);
    if (!newsAndBlog) {
      return res.status(404).json({ message: "News and blog not found" });
    }
    res.status(200).json(newsAndBlog);
  } catch (error) {
    console.error("Error getting news and blog by ID:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};


export const getBlogOnlyById = async (req, res) =>{
  try {
    const { blogId } = req.params;
    const blog = await NewsAndBlog.findById(blogId);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
      }
    if(blog.contentType === "blog"){
      res.status(200).json(blog);
    }else{
      return res.status(404).json({ message: "Blog not found" });
    }
    } catch (error) {
    console.error("Error getting blog by ID:", error.message);
    res.status(500).json({ message: "Server error" });
  }
}

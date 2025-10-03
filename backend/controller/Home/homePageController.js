import {
  Banner,
  BannerText,
  Button,
  Poetry,
  Testimony,
  Intro,
  ContactInfo,
} from "../../models/Home/homePageModel.js";
import path from "path";
import multer from "multer";
import { saveBufferToLocal, deleteLocalByUrl } from "../../utils/fileStorage.js";

const storage = multer.memoryStorage();
const upload = multer({ storage }).single("image_url");
export const addBanner = async (req, res) => {
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
    const file = req.file;
    let imageUrl = "";
    if (file) {
      imageUrl = await saveBufferToLocal(file, "Banner");
    }

    const banner = await Banner.create({ image_url: imageUrl });
    res.json({ message: "Banner Added Successfully", banner: banner });
  } catch (error) {
    console.error("Error adding banner:", error);
    res.status(500).json({ message: "Server error" });
  }
};
export const getBanner = async (req, res) => {
  try {
    const banner = await Banner.find();
    res.status(200).json(banner);
  } catch (error) {
    console.error("Error getting banner:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateBanner = async (req, res) => {
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
    const { bannerId } = req.params;
    const banner = await Banner.findById(bannerId);

    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    const file = req.file;
    let newImageUrl = banner.image_url;

    if (file) {
      // Delete old image if it exists
      if (banner.image_url) {
        try {
          await deleteLocalByUrl(banner.image_url);
        } catch (err) {
          console.warn("Failed to delete old image:", err.message);
        }
      }

      // Upload new image
      newImageUrl = await saveBufferToLocal(file, "Banner");
    }

    const updatedBanner = await Banner.findByIdAndUpdate(
      bannerId,
      { image_url: newImageUrl },
      { new: true }
    );

    return res.status(200).json({
      message: "Banner updated successfully",
      banner: updatedBanner,
    });
  } catch (error) {
    console.error("Error updating banner:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteBanner = async (req, res) => {
  try {
    const { bannerId } = req.params;
    const banner = await Banner.findById(bannerId);
    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }
    if (banner.image_url) {
      console.log("Attempting to delete banner image:", banner.image_url);
      try {
        await deleteLocalByUrl(banner.image_url);
        console.log("Successfully deleted banner image:", banner.image_url);
      } catch (err) {
        console.warn("Warning: Failed to delete image:", err.message);
      }
    }

    await Banner.findByIdAndDelete(bannerId);
    res.status(200).json({ message: "Banner deleted successfully" });
  } catch (error) {
    console.error("Error deleting banner:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const addText = async (req, res) => {
  try {
    const { bannerText, bannerSubText, location, link } = req.body;
    const existing = await BannerText.find();
    if (existing.length > 0) {
      return res.status(400).json({ message: "Banner already exists" });
    }
    const newText = await BannerText.create({
      bannerText,
      bannerSubText,
      location,
      link,
    });
    res.status(201).json(newText);
  } catch (err) {
    console.error("Error adding text:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getText = async (req, res) => {
  try {
    const getText = await BannerText.find();
    res.status(200).json(getText);
  } catch (error) {
    console.error("Error getting text:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
export const updateText = async (req, res) => {
  try {
    const { bannerText, bannerSubText, location, link } = req.body;
    const { bannerId } = req.params;
    const bannerTextUpdate = await BannerText.findByIdAndUpdate(
      bannerId,
      { bannerText, bannerSubText, location, link },
      { new: true }
    );
    res.status(200).json(bannerTextUpdate);
  } catch (err) {
    console.error("Error updating text:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};
export const deleteText = async (req, res) => {
  try {
    const { bannerId } = req.params;
    await BannerText.findByIdAndDelete(bannerId);
    res.status(200).json({ message: "Text deleted successfully" });
  } catch (err) {
    console.error("Error deleting text:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};
export const addButtonText = async (req, res) => {
  try {
    const { text, link } = req.body;
    const existing = await Button.find();
    if (existing.length > 0) {
      return res.status(400).json({ message: "Banner already exists" });
    }
    const newText = await Button.create({ text, link });
    res.status(201).json(newText);
  } catch (err) {
    console.error("Error adding text:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getButtonText = async (req, res) => {
  try {
    const getText = await Button.find();
    res.status(200).json(getText);
  } catch (err) {
    console.error("Error getting text:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};
export const updateButtonText = async (req, res) => {
  try {
    const { buttonId } = req.params;
    const { text, link } = req.body;

    const ButtonUpdate = await Button.findByIdAndUpdate(
      buttonId,
      { text, link },
      { new: true }
    );
    res.status(201).json(ButtonUpdate);
  } catch (err) {
    console.error("Error updating text:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteButtonText = async (req, res) => {
  try {
    const { buttonId } = req.params;
    await Button.findByIdAndDelete(buttonId);
    res.status(200).json({ message: "Text deleted successfully" });
  } catch (err) {
    console.error("Error deleting text:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const addPoetry = async (req, res) => {
  try {
    const { text, author } = req.body;
    const existing = await Poetry.find();
   
    const newPoetry = await Poetry.create({ text, author });
    res.status(201).json(newPoetry);
  } catch (error) {
    console.error("Error adding poetry:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updatePoetry = async (req, res) => {
  try {
    const { poetryId } = req.params;
    const { text, author } = req.body;
    const updatedPoetry = await Poetry.findByIdAndUpdate(
      poetryId,
      { text, author },
      { new: true }
    );
    res.status(201).json(updatedPoetry);
  } catch (err) {
    console.error("Error updating poetry:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getPoetry = async (req, res) => {
  try {
    const poetry = await Poetry.find();
    res.status(200).json(poetry);
  } catch (error) {
    console.error("Error getting poetry:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
export const deletePoetry = async (req, res) => {
  try {
    const { poetryId } = req.params;
    await Poetry.findByIdAndDelete(poetryId);
    res.status(200).json({ message: "Poetry deleted successfully" });
  } catch (error) {
    console.error("Error deleting poetry:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
export const addTestimonial = async (req, res) => {
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
    const { name, about, description } = req.body;
    const existing = await Testimony.find();

    const file = req.file;
    let imageUrl = "";
    if (file) {
      imageUrl = await saveBufferToLocal(file, "Testimonial");
    }

    const newTestimonial = await Testimony.create({
      name,
      about,
      description,
      image_url: imageUrl,
    });
    res.status(201).json(newTestimonial);
  } catch (error) {
    console.error("Error adding testimonial:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimony.find();
    res.status(200).json(testimonials);
  } catch (error) {
    console.error("Error getting testimonials:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateTestimonial = async (req, res) => {
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
    const { testimonyId } = req.params;
    const { name, about, description } = req.body;
    const testimonial = await Testimony.findById(testimonyId);
    if (!testimonial) {
      return res.status(404).json({ message: "Testimonial not found" });
    }
    const file = req.file;
    let newImageUrl = testimonial.image_url;

    if (file) {
      // Delete old image if it exists
      if (testimonial.image_url) {
        try {
          await deleteLocalByUrl(testimonial.image_url);
        } catch (err) {
          console.warn("Failed to delete old image:", err.message);
        }
      }

      // Upload new image
      newImageUrl = await saveBufferToLocal(file, "Testimonial");
    }
    const updateTestimonial = await Testimony.findByIdAndUpdate(
      testimonyId,
      { name, about, description, image_url: newImageUrl },
      { new: true }
    );
    res.status(201).json(updateTestimonial);
  } catch (err) {
    console.error("Error updating testimonial:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteTestimonial = async (req, res) => {
  try {
    const { testimonialId } = req.params;
    const testimony = await Testimony.findById(testimonialId);
    if (!testimonialId) {
      return res.status(404).json({ message: "Testimonial not found" });
    }
    if (testimony.image_url) {
      try {
        await deleteLocalByUrl(testimony.image_url);
      } catch (err) {
        console.warn("Warning: Failed to delete image:", err.message);
      }
    }
    await Testimony.findByIdAndDelete(testimonialId);
    res.status(200).json({ message: "Testimonial deleted successfully" });
  } catch (err) {
    console.error("Error deleting testimonial:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Intro: title, description, date, optional image (local storage)
export const addIntro = async (req, res) => {
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
    const { title, description, date } = req.body;

    const file = req.file;
    let imageUrl = "";
    if (file) {
      imageUrl = await saveBufferToLocal(file, "Intro");
    }

    const intro = await Intro.create({
      title,
      description,
      date: date ? new Date(date) : undefined,
      image_url: imageUrl,
    });
    res.status(201).json(intro);
  } catch (error) {
    console.error("Error adding intro:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getIntro = async (req, res) => {
  try {
    const intro = await Intro.find();
    res.status(200).json(intro);
  } catch (error) {
    console.error("Error getting intro:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateIntro = async (req, res) => {
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
    const { introId } = req.params;
    const { title, description, date } = req.body;
    const intro = await Intro.findById(introId);
    if (!intro) {
      return res.status(404).json({ message: "Intro not found" });
    }

    const file = req.file;
    let newImageUrl = intro.image_url;

    if (file) {
      // Delete old image if it exists
      if (intro.image_url) {
        try {
          await deleteLocalByUrl(intro.image_url);
        } catch (err) {
          console.warn("Failed to delete old image:", err.message);
        }
      }

      // Upload new image
      newImageUrl = await saveBufferToLocal(file, "Intro");
    }

    const updated = await Intro.findByIdAndUpdate(
      introId,
      { title, description, date: date ? new Date(date) : intro.date, image_url: newImageUrl },
      { new: true }
    );
    res.status(201).json(updated);
  } catch (error) {
    console.error("Error updating intro:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteIntro = async (req, res) => {
  try {
    const { introId } = req.params;
    const intro = await Intro.findById(introId);
    if (!intro) {
      return res.status(404).json({ message: "Intro not found" });
    }
    if (intro.image_url) {
      try {
        await deleteLocalByUrl(intro.image_url);
      } catch (err) {
        console.warn("Warning: Failed to delete image:", err.message);
      }
    }
    await Intro.findByIdAndDelete(introId);
    res.status(200).json({ message: "Intro deleted successfully" });
  } catch (error) {
    console.error("Error deleting intro:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Contact Information CRUD operations
export const addContactInfo = async (req, res) => {
  try {
    const { officeAddress, eventVenue, email, emailLink } = req.body;
    
    // Check if contact info already exists (only allow one contact info record)
    const existing = await ContactInfo.find();
    if (existing.length > 0) {
      return res.status(400).json({ message: "Contact information already exists. Use update endpoint to modify." });
    }
    
    const contactInfo = await ContactInfo.create({
      officeAddress,
      eventVenue,
      email,
      emailLink: emailLink || `mailto:${email}`, // Default to mailto link if not provided
    });
    res.status(201).json(contactInfo);
  } catch (error) {
    console.error("Error adding contact info:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getContactInfo = async (req, res) => {
  try {
    const contactInfo = await ContactInfo.find();
    res.status(200).json(contactInfo);
  } catch (error) {
    console.error("Error getting contact info:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateContactInfo = async (req, res) => {
  try {
    const { contactInfoId } = req.params;
    const { officeAddress, eventVenue, email, emailLink } = req.body;
    
    const contactInfo = await ContactInfo.findById(contactInfoId);
    if (!contactInfo) {
      return res.status(404).json({ message: "Contact information not found" });
    }
    
    const updated = await ContactInfo.findByIdAndUpdate(
      contactInfoId,
      { 
        officeAddress, 
        eventVenue, 
        email, 
        emailLink: emailLink || `mailto:${email}` 
      },
      { new: true }
    );
    res.status(200).json(updated);
  } catch (error) {
    console.error("Error updating contact info:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteContactInfo = async (req, res) => {
  try {
    const { contactInfoId } = req.params;
    const contactInfo = await ContactInfo.findById(contactInfoId);
    if (!contactInfo) {
      return res.status(404).json({ message: "Contact information not found" });
    }
    
    await ContactInfo.findByIdAndDelete(contactInfoId);
    res.status(200).json({ message: "Contact information deleted successfully" });
  } catch (error) {
    console.error("Error deleting contact info:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

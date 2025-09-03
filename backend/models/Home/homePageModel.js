import mongoose from "mongoose";


const bannerSchmea = new mongoose.Schema({
    image_url: String,

})
const Banner = mongoose.model("Banner", bannerSchmea);
const textSchmea = new mongoose.Schema({
    bannerText: {
        type: String,
        required: true

    },
    bannerSubText: {
        type: String,
       
    },
    location: {
        type: String,
    }

})
const BannerText = mongoose.model("Text", textSchmea);

const buttonTextSchema = new mongoose.Schema({
    text: {
        type: String,
        
    },
    link: {
        type: String,
        required: true
    }
})
const Button = mongoose.model("Button", buttonTextSchema);

const poetrySchmea =  new mongoose.Schema({
    text: {
        type: String,
        required: true
    },
    author:{
        type: String,
        required: true
    }
})
const Poetry = mongoose.model("Poetry", poetrySchmea);

const testiMoneySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    about: {
        type: String,
        required: true
    },
    description:{
        type: String,
        required: true
    },
    image_url: {
        type: String,
        required: true
    }
})
const Testimony = mongoose.model("Testimony", testiMoneySchema);

// Intro section: title, description, date, optional image
const introSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    image_url: {
        type: String
    }
})
const Intro = mongoose.model("Intro", introSchema);

export  {Banner, BannerText, Button, Poetry, Testimony, Intro};
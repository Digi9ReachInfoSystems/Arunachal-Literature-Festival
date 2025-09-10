// import dotenv from "dotenv";
// import mongoose from "mongoose";
// dotenv.config();


// const connectDB = async ()=>{
//     try {
//         await mongoose.connect(process.env.MONGO_URI, {
//             useNewUrlParser: true,
//             useUnifiedTopology: true,
//             retryWrites: false,
//             socketTimeoutMS: 45000,
//             serverSelectionTimeoutMS: 30000,
//         });
//         console.log("MongoDB connected successfully");

//     }
//     catch(err){
//         console.error("mongoDB connection failed",err.message);
//     }
// }
// export default connectDB;

import dotenv from "dotenv";
import mongoose from "mongoose";
dotenv.config();


const connectDB = async ()=>{
    try {
        const originalUri = process.env.MONGO_URI || "";
        const isSrv = /mongodb\+srv:/i.test(originalUri);
        const hasReplicaSet = /[?&]replicaSet=/i.test(originalUri);

        // If using Atlas or any SRV/replica set URI, don't force directConnection or modify retryWrites
        // Otherwise, disable retryable writes and enable direct connection for standalone servers
        const finalUri = (isSrv || hasReplicaSet)
          ? originalUri
          : originalUri.replace(/retryWrites=true/gi, "retryWrites=false");

        const connectionOptions = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            retryWrites: isSrv || hasReplicaSet ? undefined : false,
            directConnection: isSrv || hasReplicaSet ? undefined : true,
            socketTimeoutMS: 45000,
            serverSelectionTimeoutMS: 30000,
        };

        console.log(`Connecting to MongoDB (srv=${isSrv}, replicaSet=${hasReplicaSet})...`);
        await mongoose.connect(finalUri, connectionOptions);
        console.log("MongoDB connected successfully");

    }
    catch(err){
        console.error("mongoDB connection failed",err.message);
    }
}
export default connectDB;

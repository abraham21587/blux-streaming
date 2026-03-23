import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const connectDB = async (): Promise<void> => {
    try {
        const mongoURI = process.env.MONGODB_URI || '';
        console.log('URI leído:', mongoURI);
        await mongoose.connect(mongoURI);
        console.log(`✅ MongoDB conectado: ${mongoose.connection.host}`);
    } catch (error: any) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

export default connectDB;
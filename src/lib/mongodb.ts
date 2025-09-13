import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

let isConnected = false;

async function dbConnect() {
  if (isConnected) {
    return;
  }

  try {
    const options = {
      maxPoolSize: 5, // Reducir pool size
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: true,
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxIdleTimeMS: 30000, // Cerrar conexiones idle después de 30s
      minPoolSize: 0, // Permitir que el pool se vacíe completamente
    };

    await mongoose.connect(MONGODB_URI, options);
    isConnected = true;
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

export default dbConnect; 
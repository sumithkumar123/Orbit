import mongoose from 'mongoose';

const connectDb = async () => {
  try {
    const connect = await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected: ' + connect.connection.host);
    console.log('Host Name: ' + connect.connection.name);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export default connectDb;

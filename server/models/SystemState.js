// server/models/SystemState.js
import mongoose from 'mongoose';

const systemStateSchema = new mongoose.Schema(
  {
    running: { type: Boolean, default: true },
    reason: { type: String, default: '' },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

export default mongoose.model('SystemState', systemStateSchema);

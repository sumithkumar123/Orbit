import mongoose, { Schema } from 'mongoose';

const ThreadSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['direct', 'broadcast'],
      required: true,
      index: true,
    },
    // For 'direct' threads, exactly 2 user ids (sorted, unique).
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        index: true,
      },
    ],
    last_msg_at: {
      type: Date,
      default: null,
      index: true,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
    collection: 'threads',
  }
);

// Ensure at most one broadcast thread
ThreadSchema.index(
  { type: 1 },
  { unique: true, partialFilterExpression: { type: 'broadcast' } }
);

// For fast direct thread lookups (2-member set)
ThreadSchema.index({ members: 1 }, { sparse: true });

const Thread =
  mongoose.models.Thread || mongoose.model('Thread', ThreadSchema);

export default Thread;

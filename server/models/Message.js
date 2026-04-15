import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema(
  {
    thread_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Thread',
      required: true,
      index: true,
    },
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // for direct chats this is the recipient; for broadcast keep it null
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    body: {
      type: String,
      trim: true,
      maxlength: 2000,
      required: true,
    },
    created_at: {
      type: Date,
      default: Date.now,
      index: true,
    },
    // (optional future fields)
    delivered_at: { type: Date, default: null, index: true },
    read_at: { type: Date, default: null, index: true },
  },
  {
    versionKey: false,
    collection: 'messages',
  }
);

// Fast history pagination per thread
MessageSchema.index({ thread_id: 1, created_at: -1 });

const Message = mongoose.model('Message', MessageSchema);

export default Message;

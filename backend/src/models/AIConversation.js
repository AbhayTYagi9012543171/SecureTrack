import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, trim: true, maxlength: 120, default: 'New security conversation' },
  lastMessageAt: { type: Date, default: Date.now, index: true },
}, { timestamps: true });

schema.index({ owner: 1, lastMessageAt: -1 });
export default mongoose.model('AIConversation', schema);

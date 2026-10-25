import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'AIConversation', required: true, index: true },
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true, maxlength: 12000 },
  sources: [{ type: mongoose.Schema.Types.Mixed }],
  model: { type: String, maxlength: 100 },
  usage: {
    promptTokens: { type: Number, min: 0 },
    completionTokens: { type: Number, min: 0 },
  },
}, { timestamps: true });

schema.index({ owner: 1, conversation: 1, createdAt: 1 });
export default mongoose.model('AIMessage', schema);

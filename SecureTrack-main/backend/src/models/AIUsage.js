import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'AIConversation' },
  feature: { type: String, enum: ['chat', 'finding_analysis', 'risk_insights', 'report_summary'], required: true },
  provider: { type: String, default: 'openai' },
  model: { type: String, required: true },
  promptTokens: { type: Number, min: 0, default: 0 },
  completionTokens: { type: Number, min: 0, default: 0 },
  requestId: { type: String, required: true },
}, { timestamps: true });

schema.index({ owner: 1, createdAt: -1 });
export default mongoose.model('AIUsage', schema);

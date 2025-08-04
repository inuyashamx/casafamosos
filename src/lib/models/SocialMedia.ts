import mongoose from 'mongoose';

const SocialMediaSchema = new mongoose.Schema({
  whatsapp: {
    type: String,
    default: null,
  },
  telegram: {
    type: String,
    default: null,
  },
  twitter: {
    type: String,
    default: null,
  },
  facebook: {
    type: String,
    default: null,
  },
  instagram: {
    type: String,
    default: null,
  },
  tiktok: {
    type: String,
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

export default mongoose.models.SocialMedia || mongoose.model('SocialMedia', SocialMediaSchema); 
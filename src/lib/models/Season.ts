import mongoose from 'mongoose';

const SeasonSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  dailyPointsDefault: {
    type: Number,
    default: 60,
  },
  votingEndTime: {
    type: String, // Formato: "20:00" (8 PM)
    default: "20:00",
  },
  votingDays: [{
    type: String, // ["monday", "tuesday", etc.]
  }],
}, {
  timestamps: true,
});

export default mongoose.models.Season || mongoose.model('Season', SeasonSchema); 
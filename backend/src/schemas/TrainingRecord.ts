import mongoose from 'mongoose';

export interface ITrainingRecord extends mongoose.Document {
  playerId: mongoose.Types.ObjectId;
  teamId: mongoose.Types.ObjectId;
  type: 'free' | 'fc' | 'premium';
  attribute?: string;
  improvement: number;
  cost: number;
  date: Date;
  createdAt: Date;
}

const trainingRecordSchema = new mongoose.Schema<ITrainingRecord>({
  playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  type: { type: String, enum: ['free', 'fc', 'premium'], required: true },
  attribute: { type: String },
  improvement: { type: Number, default: 0 },
  cost: { type: Number, default: 0 },
  date: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

trainingRecordSchema.index({ playerId: 1, date: -1 });
trainingRecordSchema.index({ teamId: 1, date: -1 });
trainingRecordSchema.index({ date: 1 });

const TrainingRecord = mongoose.model<ITrainingRecord>('TrainingRecord', trainingRecordSchema);
export default TrainingRecord;

import mongoose from 'mongoose';

export interface IYouthPlayer extends mongoose.Document {
  teamId: mongoose.Types.ObjectId;
  squad: 'U18' | 'U20';
  playerData: {
    name: string;
    position: string;
    age: number;
    overallRating: number;
    potential: number;
    nationality: string;
    physical: {
      pace: number;
      strength: number;
      stamina: number;
      agility: number;
      jumping: number;
    };
    technical: {
      passing: number;
      shooting: number;
      dribbling: number;
      defending: number;
      heading: number;
      technique: number;
    };
    mental: {
      vision: number;
      composure: number;
      positioning: number;
      decisions: number;
      leadership: number;
    };
  };
  promotedAt?: Date;
  promotedTo?: string;
  createdAt: Date;
}

const youthPlayerSchema = new mongoose.Schema<IYouthPlayer>({
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  squad: { type: String, enum: ['U18', 'U20'], required: true },
  playerData: {
    name: { type: String, required: true },
    position: { type: String, required: true },
    age: { type: Number, required: true },
    overallRating: { type: Number, required: true },
    potential: { type: Number, required: true },
    nationality: { type: String, required: true },
    physical: {
      pace: { type: Number, default: 50 },
      strength: { type: Number, default: 50 },
      stamina: { type: Number, default: 50 },
      agility: { type: Number, default: 50 },
      jumping: { type: Number, default: 50 },
    },
    technical: {
      passing: { type: Number, default: 50 },
      shooting: { type: Number, default: 50 },
      dribbling: { type: Number, default: 50 },
      defending: { type: Number, default: 50 },
      heading: { type: Number, default: 50 },
      technique: { type: Number, default: 50 },
    },
    mental: {
      vision: { type: Number, default: 50 },
      composure: { type: Number, default: 50 },
      positioning: { type: Number, default: 50 },
      decisions: { type: Number, default: 50 },
      leadership: { type: Number, default: 50 },
    },
  },
  promotedAt: { type: Date },
  promotedTo: { type: String },
  createdAt: { type: Date, default: Date.now },
});

youthPlayerSchema.index({ teamId: 1, squad: 1 });
youthPlayerSchema.index({ teamId: 1, promotedAt: 1 });

const YouthPlayer = mongoose.model<IYouthPlayer>('YouthPlayer', youthPlayerSchema);
export default YouthPlayer;

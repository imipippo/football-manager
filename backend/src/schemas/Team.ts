import mongoose from 'mongoose';

export interface ITeam extends mongoose.Document {
  name: string;
  shortName: string;
  logo?: string;
  owner: mongoose.Types.ObjectId;
  league?: mongoose.Types.ObjectId;
  players: mongoose.Types.ObjectId[];
  
  tactics: {
    formation: string;
    style: 'attacking' | 'balanced' | 'defensive' | 'counter';
    pressingIntensity: number;
    tempo: number;
    width: number;
  };
  
  finance: {
    budget: number;
    weeklyWage: number;
    weeklyIncome: number;
    weeklyExpense: number;
  };
  
  facilities: {
    stadiumLevel: number;
    trainingLevel: number;
    youthLevel: number;
    medicalLevel: number;
  };
  
  reputation: number;
  fans: number;
  createdAt: Date;
}

const teamSchema = new mongoose.Schema<ITeam>({
  name: { type: String, required: true },
  shortName: { type: String, required: true },
  logo: { type: String },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  league: { type: mongoose.Schema.Types.ObjectId, ref: 'League' },
  players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
  
  tactics: {
    formation: { type: String, default: '4-4-2' },
    style: { 
      type: String, 
      default: 'balanced', 
      enum: ['attacking', 'balanced', 'defensive', 'counter'] 
    },
    pressingIntensity: { type: Number, default: 50, min: 0, max: 100 },
    tempo: { type: Number, default: 50, min: 0, max: 100 },
    width: { type: Number, default: 50, min: 0, max: 100 },
  },
  
  finance: {
    budget: { type: Number, default: 5000000 },
    weeklyWage: { type: Number, default: 0 },
    weeklyIncome: { type: Number, default: 100000 },
    weeklyExpense: { type: Number, default: 0 },
  },
  
  facilities: {
    stadiumLevel: { type: Number, default: 1, min: 1, max: 10 },
    trainingLevel: { type: Number, default: 1, min: 1, max: 10 },
    youthLevel: { type: Number, default: 1, min: 1, max: 10 },
    medicalLevel: { type: Number, default: 1, min: 1, max: 10 },
  },
  
  reputation: { type: Number, default: 50, min: 1, max: 100 },
  fans: { type: Number, default: 10000 },
  
  createdAt: { type: Date, default: Date.now },
});

teamSchema.index({ owner: 1 });
teamSchema.index({ name: 1 }, { unique: true });

const Team = mongoose.model<ITeam>('Team', teamSchema);
export default Team;

import mongoose from 'mongoose';

export interface IPlayer extends mongoose.Document {
  name: string;
  age: number;
  nationality: string;
  position: string;
  team?: mongoose.Types.ObjectId;
  
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
  
  overallRating: number;
  potential: number;
  
  marketValue: number;
  wage: number;
  contractEnd: Date;
  
  status: {
    fatigue: number;
    injury: number;
    morale: number;
  };
  
  createdAt: Date;
  calculateOverallRating(): number;
}

const playerSchema = new mongoose.Schema<IPlayer>({
  name: { type: String, required: true },
  age: { type: Number, required: true, min: 15, max: 45 },
  nationality: { type: String, required: true },
  position: { 
    type: String, 
    required: true, 
    enum: ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'ST'] 
  },
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  
  physical: {
    pace: { type: Number, min: 1, max: 100, default: 50 },
    strength: { type: Number, min: 1, max: 100, default: 50 },
    stamina: { type: Number, min: 1, max: 100, default: 50 },
    agility: { type: Number, min: 1, max: 100, default: 50 },
    jumping: { type: Number, min: 1, max: 100, default: 50 },
  },
  
  technical: {
    passing: { type: Number, min: 1, max: 100, default: 50 },
    shooting: { type: Number, min: 1, max: 100, default: 50 },
    dribbling: { type: Number, min: 1, max: 100, default: 50 },
    defending: { type: Number, min: 1, max: 100, default: 50 },
    heading: { type: Number, min: 1, max: 100, default: 50 },
    technique: { type: Number, min: 1, max: 100, default: 50 },
  },
  
  mental: {
    vision: { type: Number, min: 1, max: 100, default: 50 },
    composure: { type: Number, min: 1, max: 100, default: 50 },
    positioning: { type: Number, min: 1, max: 100, default: 50 },
    decisions: { type: Number, min: 1, max: 100, default: 50 },
    leadership: { type: Number, min: 1, max: 100, default: 50 },
  },
  
  overallRating: { type: Number, min: 1, max: 100, default: 50 },
  potential: { type: Number, min: 1, max: 100, default: 50 },
  
  marketValue: { type: Number, default: 0 },
  wage: { type: Number, default: 0 },
  contractEnd: { type: Date },
  
  status: {
    fatigue: { type: Number, default: 0, min: 0, max: 100 },
    injury: { type: Number, default: 0 },
    morale: { type: Number, default: 70, min: 0, max: 100 },
  },
  
  createdAt: { type: Date, default: Date.now },
});

playerSchema.methods.calculateOverallRating = function(): number {
  const positionWeights: Record<string, { physical: number; technical: number; mental: number }> = {
    GK: { physical: 0.3, technical: 0.5, mental: 0.2 },
    CB: { physical: 0.35, technical: 0.35, mental: 0.3 },
    LB: { physical: 0.35, technical: 0.35, mental: 0.3 },
    RB: { physical: 0.35, technical: 0.35, mental: 0.3 },
    CDM: { physical: 0.25, technical: 0.4, mental: 0.35 },
    CM: { physical: 0.2, technical: 0.45, mental: 0.35 },
    CAM: { physical: 0.15, technical: 0.5, mental: 0.35 },
    LM: { physical: 0.3, technical: 0.4, mental: 0.3 },
    RM: { physical: 0.3, technical: 0.4, mental: 0.3 },
    LW: { physical: 0.3, technical: 0.45, mental: 0.25 },
    RW: { physical: 0.3, technical: 0.45, mental: 0.25 },
    ST: { physical: 0.25, technical: 0.45, mental: 0.3 },
  };
  
  const weights = positionWeights[this.position] || { physical: 0.25, technical: 0.4, mental: 0.35 };
  
  const physicalValues = Object.values(this.physical) as number[];
  const technicalValues = Object.values(this.technical) as number[];
  const mentalValues = Object.values(this.mental) as number[];
  
  const physicalAvg = physicalValues.reduce((a, b) => a + b, 0) / 5;
  const technicalAvg = technicalValues.reduce((a, b) => a + b, 0) / 6;
  const mentalAvg = mentalValues.reduce((a, b) => a + b, 0) / 5;
  
  return Math.round(
    physicalAvg * weights.physical +
    technicalAvg * weights.technical +
    mentalAvg * weights.mental
  );
};

playerSchema.pre('save', function(next) {
  this.overallRating = this.calculateOverallRating();
  next();
});

playerSchema.index({ team: 1 });
playerSchema.index({ position: 1 });
playerSchema.index({ overallRating: -1 });

const Player = mongoose.model<IPlayer>('Player', playerSchema);
export default Player;

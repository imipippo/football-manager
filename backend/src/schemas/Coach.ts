import mongoose from 'mongoose';

export interface ICoach extends mongoose.Document {
  name: string;
  type: 'head' | 'goalkeeper' | 'fitness' | 'defense' | 'attack' | 'assistant' | 'youth' | 'psychology' | 'analyst';
  team?: mongoose.Types.ObjectId;
  
  attributes: {
    coaching: number;
    motivation: number;
    tactical: number;
    technical: number;
    fitness: number;
    youth: number;
  };
  
  experience: number;
  wage: number;
  contractEnd: Date;
  
  specialty?: string;
  
  createdAt: Date;
}

const coachSchema = new mongoose.Schema<ICoach>({
  name: { type: String, required: true },
  type: { 
    type: String, 
    required: true, 
    enum: ['head', 'goalkeeper', 'fitness', 'defense', 'attack', 'assistant', 'youth', 'psychology', 'analyst'] 
  },
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  
  attributes: {
    coaching: { type: Number, min: 1, max: 100, default: 50 },
    motivation: { type: Number, min: 1, max: 100, default: 50 },
    tactical: { type: Number, min: 1, max: 100, default: 50 },
    technical: { type: Number, min: 1, max: 100, default: 50 },
    fitness: { type: Number, min: 1, max: 100, default: 50 },
    youth: { type: Number, min: 1, max: 100, default: 50 },
  },
  
  experience: { type: Number, default: 0 },
  wage: { type: Number, default: 0 },
  contractEnd: { type: Date },
  
  specialty: { type: String },
  
  createdAt: { type: Date, default: Date.now },
});

coachSchema.methods.calculateTrainingBonus = function(attribute: string): number {
  const typeBonuses: Record<string, Record<string, number>> = {
    head: { coaching: 1.0, motivation: 0.8, tactical: 0.8, technical: 0.7, fitness: 0.6, youth: 0.5 },
    goalkeeper: { technical: 1.2, coaching: 0.8 },
    fitness: { fitness: 1.5, coaching: 0.5 },
    defense: { tactical: 1.2, technical: 1.0, coaching: 0.6 },
    attack: { tactical: 1.0, technical: 1.2, coaching: 0.6 },
    assistant: { coaching: 1.0, motivation: 0.8, tactical: 0.5 },
    youth: { youth: 1.5, coaching: 0.8 },
    psychology: { motivation: 1.5, coaching: 0.5 },
    analyst: { tactical: 1.2, coaching: 0.4 },
  };
  
  const bonuses = typeBonuses[this.type] || {};
  const attributeBonus = bonuses[attribute] || 0;
  
  const attributeValue = this.attributes[attribute as keyof typeof this.attributes] || 50;
  
  return Math.round(attributeBonus * attributeValue / 100 * 100) / 100;
};

coachSchema.methods.calculateOverallRating = function(): number {
  const typeWeights: Record<string, Record<string, number>> = {
    head: { coaching: 0.3, motivation: 0.2, tactical: 0.2, technical: 0.15, fitness: 0.1, youth: 0.05 },
    goalkeeper: { technical: 0.5, coaching: 0.3, motivation: 0.1, tactical: 0.1 },
    fitness: { fitness: 0.6, coaching: 0.2, motivation: 0.1, youth: 0.1 },
    defense: { tactical: 0.3, technical: 0.3, coaching: 0.2, motivation: 0.1, fitness: 0.1 },
    attack: { technical: 0.3, tactical: 0.3, coaching: 0.2, motivation: 0.1, fitness: 0.1 },
    assistant: { coaching: 0.4, motivation: 0.3, tactical: 0.1, technical: 0.1, fitness: 0.05, youth: 0.05 },
    youth: { youth: 0.5, coaching: 0.3, motivation: 0.1, technical: 0.1 },
    psychology: { motivation: 0.6, coaching: 0.2, tactical: 0.1, youth: 0.1 },
    analyst: { tactical: 0.5, technical: 0.2, coaching: 0.2, motivation: 0.1 },
  };
  
  const weights = typeWeights[this.type] || {};
  let total = 0;
  
  for (const [attr, weight] of Object.entries(weights)) {
    const value = this.attributes[attr as keyof typeof this.attributes] || 50;
    total += value * weight;
  }
  
  return Math.round(total);
};

coachSchema.index({ team: 1 });
coachSchema.index({ type: 1 });

const Coach = mongoose.model<ICoach>('Coach', coachSchema);
export default Coach;

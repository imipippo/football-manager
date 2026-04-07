import mongoose from 'mongoose';

export interface ISponsor extends mongoose.Document {
  teamId: mongoose.Types.ObjectId;
  type: 'main' | 'sleeve' | 'stadium' | 'training' | 'partner';
  name: string;
  amount: number;
  duration: number;
  startDate: Date;
  status: 'active' | 'expired' | 'terminated';
  createdAt: Date;
}

const sponsorSchema = new mongoose.Schema<ISponsor>({
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  type: { 
    type: String, 
    enum: ['main', 'sleeve', 'stadium', 'training', 'partner'], 
    required: true 
  },
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  duration: { type: Number, required: true },
  startDate: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['active', 'expired', 'terminated'], 
    default: 'active' 
  },
  createdAt: { type: Date, default: Date.now },
});

sponsorSchema.index({ teamId: 1, status: 1 });
sponsorSchema.index({ teamId: 1, type: 1 });

const Sponsor = mongoose.model<ISponsor>('Sponsor', sponsorSchema);
export default Sponsor;

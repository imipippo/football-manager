import mongoose from 'mongoose';

export interface IFinanceRecord extends mongoose.Document {
  teamId: mongoose.Types.ObjectId;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  date: Date;
  createdAt: Date;
}

const financeRecordSchema = new mongoose.Schema<IFinanceRecord>({
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  description: { type: String },
  date: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

financeRecordSchema.index({ teamId: 1, date: -1 });
financeRecordSchema.index({ type: 1 });
financeRecordSchema.index({ category: 1 });

const FinanceRecord = mongoose.model<IFinanceRecord>('FinanceRecord', financeRecordSchema);
export default FinanceRecord;

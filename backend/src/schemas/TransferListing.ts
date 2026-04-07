import mongoose from 'mongoose';

export interface ITransferListing extends mongoose.Document {
  playerId: mongoose.Types.ObjectId;
  askingPrice: number;
  listedBy: mongoose.Types.ObjectId;
  listedAt: Date;
  status: 'active' | 'sold' | 'withdrawn';
  createdAt: Date;
}

const transferListingSchema = new mongoose.Schema<ITransferListing>({
  playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
  askingPrice: { type: Number, required: true },
  listedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  listedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['active', 'sold', 'withdrawn'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
});

transferListingSchema.index({ status: 1 });
transferListingSchema.index({ listedBy: 1 });
transferListingSchema.index({ playerId: 1 });

const TransferListing = mongoose.model<ITransferListing>('TransferListing', transferListingSchema);
export default TransferListing;

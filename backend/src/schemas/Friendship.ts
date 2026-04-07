import mongoose from 'mongoose';

export interface IFriendship extends mongoose.Document {
  requester: mongoose.Types.ObjectId;
  recipient: mongoose.Types.ObjectId;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const friendshipSchema = new mongoose.Schema<IFriendship>({
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'rejected'], 
    default: 'pending' 
  },
}, { timestamps: true });

friendshipSchema.index({ requester: 1, recipient: 1 }, { unique: true });
friendshipSchema.index({ status: 1 });

const Friendship = mongoose.model<IFriendship>('Friendship', friendshipSchema);
export default Friendship;

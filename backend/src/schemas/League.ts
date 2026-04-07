import mongoose from 'mongoose';

export interface ILeague extends mongoose.Document {
  name: string;
  level: number;
  region: string;
  season: number;
  
  teams: mongoose.Types.ObjectId[];
  
  standings: IStanding[];
  fixtures: IFixture[];
  
  createdAt: Date;
}

export interface IStanding {
  team: mongoose.Types.ObjectId;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface IFixture {
  homeTeam: mongoose.Types.ObjectId;
  awayTeam: mongoose.Types.ObjectId;
  matchday: number;
  date: Date;
  played: boolean;
  homeScore?: number;
  awayScore?: number;
}

const standingSchema = new mongoose.Schema<IStanding>({
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  played: { type: Number, default: 0 },
  won: { type: Number, default: 0 },
  drawn: { type: Number, default: 0 },
  lost: { type: Number, default: 0 },
  goalsFor: { type: Number, default: 0 },
  goalsAgainst: { type: Number, default: 0 },
  goalDifference: { type: Number, default: 0 },
  points: { type: Number, default: 0 },
});

const fixtureSchema = new mongoose.Schema<IFixture>({
  homeTeam: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  awayTeam: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  matchday: { type: Number, required: true },
  date: { type: Date },
  played: { type: Boolean, default: false },
  homeScore: { type: Number },
  awayScore: { type: Number },
});

const leagueSchema = new mongoose.Schema<ILeague>({
  name: { type: String, required: true, unique: true },
  level: { type: Number, required: true },
  region: { type: String, required: true },
  season: { type: Number, default: new Date().getFullYear() },
  
  teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
  
  standings: [standingSchema],
  fixtures: [fixtureSchema],
  
  createdAt: { type: Date, default: Date.now },
});

leagueSchema.index({ level: 1, region: 1 });

const League = mongoose.model<ILeague>('League', leagueSchema);
export default League;

import request from 'supertest';
import app from '../index';
import User from '../schemas/User';
import Player from '../schemas/Player';

let authToken: string;
let userId: string;

beforeEach(async () => {
  const user = await User.create({
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
  });
  userId = user._id.toString();

  const loginResponse = await request(app)
    .post('/api/v1/auth/login')
    .send({
      email: 'test@example.com',
      password: 'password123',
    });

  authToken = loginResponse.body.data.token;
});

describe('Player Controller', () => {
  describe('POST /api/v1/players', () => {
    it('should create a new player successfully', async () => {
      const playerData = {
        name: 'Test Player',
        age: 25,
        nationality: 'China',
        position: 'ST',
        physical: {
          pace: 80,
          strength: 75,
          stamina: 70,
          agility: 85,
          jumping: 78,
        },
        technical: {
          passing: 75,
          shooting: 82,
          dribbling: 78,
          defending: 40,
          heading: 76,
          technique: 80,
        },
        mental: {
          vision: 70,
          composure: 75,
          positioning: 78,
          decisions: 72,
          leadership: 65,
        },
        marketValue: 1000000,
        wage: 10000,
        contractEnd: '2026-12-31',
      };

      const response = await request(app)
        .post('/api/v1/players')
        .set('Authorization', `Bearer ${authToken}`)
        .send(playerData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(playerData.name);
      expect(response.body.data.position).toBe(playerData.position);
      expect(response.body.data).toHaveProperty('overallRating');
    });

    it('should fail to create player without auth', async () => {
      const response = await request(app)
        .post('/api/v1/players')
        .send({ name: 'Test Player' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/players', () => {
    beforeEach(async () => {
      await Player.create([
        {
          name: 'Player 1',
          age: 25,
          nationality: 'China',
          position: 'ST',
          physical: { pace: 80, strength: 75, stamina: 70, agility: 85, jumping: 78 },
          technical: { passing: 75, shooting: 82, dribbling: 78, defending: 40, heading: 76, technique: 80 },
          mental: { vision: 70, composure: 75, positioning: 78, decisions: 72, leadership: 65 },
          marketValue: 1000000,
          wage: 10000,
          contractEnd: '2026-12-31',
        },
        {
          name: 'Player 2',
          age: 23,
          nationality: 'Brazil',
          position: 'CM',
          physical: { pace: 75, strength: 70, stamina: 85, agility: 80, jumping: 65 },
          technical: { passing: 85, shooting: 70, dribbling: 82, defending: 65, heading: 60, technique: 85 },
          mental: { vision: 88, composure: 80, positioning: 75, decisions: 85, leadership: 70 },
          marketValue: 2000000,
          wage: 20000,
          contractEnd: '2027-06-30',
        },
      ]);
    });

    it('should get all players', async () => {
      const response = await request(app)
        .get('/api/v1/players')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.count).toBe(2);
    });

    it('should get player by id', async () => {
      const players = await Player.find();
      const playerId = players[0]._id;

      const response = await request(app)
        .get(`/api/v1/players/${playerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Player 1');
    });
  });

  describe('PUT /api/v1/players/:id', () => {
    let playerId: string;

    beforeEach(async () => {
      const player = await Player.create({
        name: 'Test Player',
        age: 25,
        nationality: 'China',
        position: 'ST',
        physical: { pace: 80, strength: 75, stamina: 70, agility: 85, jumping: 78 },
        technical: { passing: 75, shooting: 82, dribbling: 78, defending: 40, heading: 76, technique: 80 },
        mental: { vision: 70, composure: 75, positioning: 78, decisions: 72, leadership: 65 },
        marketValue: 1000000,
        wage: 10000,
        contractEnd: '2026-12-31',
      });
      playerId = player._id.toString();
    });

    it('should update player successfully', async () => {
      const response = await request(app)
        .put(`/api/v1/players/${playerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ age: 26, marketValue: 1500000 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.age).toBe(26);
      expect(response.body.data.marketValue).toBe(1500000);
    });
  });

  describe('DELETE /api/v1/players/:id', () => {
    let playerId: string;

    beforeEach(async () => {
      const player = await Player.create({
        name: 'Test Player',
        age: 25,
        nationality: 'China',
        position: 'ST',
        physical: { pace: 80, strength: 75, stamina: 70, agility: 85, jumping: 78 },
        technical: { passing: 75, shooting: 82, dribbling: 78, defending: 40, heading: 76, technique: 80 },
        mental: { vision: 70, composure: 75, positioning: 78, decisions: 72, leadership: 65 },
        marketValue: 1000000,
        wage: 10000,
        contractEnd: '2026-12-31',
      });
      playerId = player._id.toString();
    });

    it('should delete player successfully', async () => {
      const response = await request(app)
        .delete(`/api/v1/players/${playerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      const deletedPlayer = await Player.findById(playerId);
      expect(deletedPlayer).toBeNull();
    });
  });
});

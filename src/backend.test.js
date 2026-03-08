import request from 'supertest';
import app from '../backend.js';

describe('Copywriter Backend', () => {
  describe('GET /health', () => {
    it('should return 200 with healthy status', async () => {
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe('healthy');
      expect(res.body.agents).toBeDefined();
      expect(res.body.agents.halbert).toBe('ready');
      expect(res.body.agents.wiebe).toBe('ready');
      expect(res.body.agents.bencivenga).toBe('ready');
    });

    it('should return timestamp', async () => {
      const res = await request(app).get('/health');

      expect(res.body.timestamp).toBeDefined();
      expect(new Date(res.body.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('POST /api/generate-copy', () => {
    it('should reject requests without tema', async () => {
      const res = await request(app)
        .post('/api/generate-copy')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_INPUT');
      expect(res.body.error.message).toContain('Tema');
    });

    it('should reject requests with empty tema', async () => {
      const res = await request(app)
        .post('/api/generate-copy')
        .send({ tema: '   ' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should accept valid request with tema only', async () => {
      const res = await request(app)
        .post('/api/generate-copy')
        .send({ tema: 'Imóveis em leilão 2026' })
        .timeout(60000); // 60s timeout for API call

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.copy).toBeDefined();
      expect(res.body.metadata).toBeDefined();
      expect(res.body.metadata.requestId).toBeDefined();
      expect(res.body.metadata.duration).toBeGreaterThan(0);
      expect(res.body.metadata.agents).toBe(3);
    });

    it('should accept valid request with tema and dados', async () => {
      const res = await request(app)
        .post('/api/generate-copy')
        .send({
          tema: 'Imóveis em leilão 2026',
          dados: 'Desconto de 40% em leilões de janeiro'
        })
        .timeout(60000);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.copy).toContain('Gary Halbert');
      expect(res.body.copy).toContain('Joanna Wiebe');
      expect(res.body.copy).toContain('Gary Bencivenga');
    });

    it('should format error response consistently', async () => {
      const res = await request(app)
        .post('/api/generate-copy')
        .send({ tema: '' });

      expect(res.body.error).toHaveProperty('code');
      expect(res.body.error).toHaveProperty('message');
      expect(res.body.error).toHaveProperty('timestamp');
    });
  });

  describe('GET /api/docs', () => {
    it('should return API documentation', async () => {
      const res = await request(app).get('/api/docs');

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Rentabiliza Ad Generator API');
      expect(res.body.version).toBe('1.0.0');
      expect(res.body.endpoints).toBeDefined();
      expect(res.body.agents).toBeDefined();
      expect(res.body.agents.length).toBe(3);
    });

    it('should list all 3 agents', async () => {
      const res = await request(app).get('/api/docs');
      const agentNames = res.body.agents.map(a => a.name);

      expect(agentNames).toContain('Gary Halbert');
      expect(agentNames).toContain('Joanna Wiebe');
      expect(agentNames).toContain('Gary Bencivenga');
    });
  });

  describe('Error handling', () => {
    it('should handle invalid JSON in request body', async () => {
      const res = await request(app)
        .post('/api/generate-copy')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      expect(res.status).toBe(400);
    });

    it('should handle missing Content-Type', async () => {
      const res = await request(app)
        .post('/api/generate-copy')
        .send(Buffer.from(JSON.stringify({ tema: 'test' })));

      // Should still work (express.json middleware handles it)
      expect([200, 400]).toContain(res.status);
    });
  });
});

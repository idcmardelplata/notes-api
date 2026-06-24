import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import type { Database } from 'sql.js';
import { createApp } from '../src/app.js';
import { createTestDb } from './setup.js';

let db: Database;
let app: ReturnType<typeof createApp>;

beforeAll(async () => {
  db = await createTestDb();
  app = createApp(db);
});

afterAll(() => {
  db.close();
});

describe('POST /api/notes', () => {
  it('should create a note', async () => {
    const res = await request(app)
      .post('/api/notes')
      .send({
        title: 'Test Note',
        content: 'Hello [[abc-123]] world',
        tags: ['tag1'],
      });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      title: 'Test Note',
      content: 'Hello [[abc-123]] world',
      tags: ['tag1'],
      references: ['abc-123'],
    });
    expect(res.body.id).toBeDefined();
    expect(res.body.createdAt).toBeDefined();
    expect(res.body.updatedAt).toBeDefined();
  });

  it('should reject empty title', async () => {
    const res = await request(app)
      .post('/api/notes')
      .send({ title: '', content: 'content' });

    expect(res.status).toBe(400);
  });

  it('should reject missing content', async () => {
    const res = await request(app).post('/api/notes').send({ title: 'Title' });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/notes', () => {
  it('should return all notes', async () => {
    const res = await request(app).get('/api/notes');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('GET /api/notes/:id', () => {
  it('should return a note by id', async () => {
    const createRes = await request(app)
      .post('/api/notes')
      .send({ title: 'Find Me', content: 'content [[ref-1]]', tags: [] });

    const res = await request(app).get(`/api/notes/${createRes.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Find Me');
    expect(res.body.references).toContain('ref-1');
  });

  it('should return 404 for non-existent note', async () => {
    const res = await request(app).get(
      '/api/notes/00000000-0000-0000-0000-000000000000',
    );
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/notes/:id', () => {
  it('should update a note', async () => {
    const createRes = await request(app)
      .post('/api/notes')
      .send({ title: 'Before', content: 'content', tags: [] });

    const res = await request(app)
      .put(`/api/notes/${createRes.body.id}`)
      .send({
        title: 'After',
        content: 'updated [[ref-2]]',
        tags: ['updated'],
      });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('After');
    expect(res.body.content).toBe('updated [[ref-2]]');
    expect(res.body.tags).toEqual(['updated']);
    expect(res.body.references).toContain('ref-2');
  });

  it('should return 404 for non-existent note', async () => {
    const res = await request(app)
      .put('/api/notes/00000000-0000-0000-0000-000000000000')
      .send({ title: 'Nope' });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/notes/:id', () => {
  it('should delete a note', async () => {
    const createRes = await request(app)
      .post('/api/notes')
      .send({ title: 'Delete Me', content: 'bye', tags: [] });

    const res = await request(app).delete(`/api/notes/${createRes.body.id}`);
    expect(res.status).toBe(204);

    const getRes = await request(app).get(`/api/notes/${createRes.body.id}`);
    expect(getRes.status).toBe(404);
  });

  it('should return 404 for non-existent note', async () => {
    const res = await request(app).delete(
      '/api/notes/00000000-0000-0000-0000-000000000000',
    );
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/notes/:id/references', () => {
  it('should update references across notes', async () => {
    const note1 = await request(app)
      .post('/api/notes')
      .send({ title: 'Source', content: 'See [[old-ref-123]]', tags: [] });

    const note2 = await request(app)
      .post('/api/notes')
      .send({ title: 'Also', content: 'Also see [[old-ref-123]]', tags: [] });

    const res = await request(app)
      .patch(`/api/notes/${note1.body.id}/references`)
      .send({ oldId: 'old-ref-123', newId: 'new-ref-456' });

    expect(res.status).toBe(200);
    expect(res.body.affected).toBe(2);

    const updated1 = await request(app).get(`/api/notes/${note1.body.id}`);
    expect(updated1.body.content).toBe('See [[new-ref-456]]');

    const updated2 = await request(app).get(`/api/notes/${note2.body.id}`);
    expect(updated2.body.content).toBe('Also see [[new-ref-456]]');
  });

  it('should reject invalid reference body', async () => {
    const res = await request(app)
      .patch('/api/notes/00000000-0000-0000-0000-000000000000/references')
      .send({ oldId: '', newId: '' });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/notes?q=&title=&tag=', () => {
  it('should search by query string', async () => {
    await request(app)
      .post('/api/notes')
      .send({
        title: 'SpecialSearch',
        content: 'unique content here',
        tags: [],
      });

    const res = await request(app).get('/api/notes?q=unique');
    expect(res.status).toBe(200);
    expect(
      res.body.some((n: { title: string }) => n.title === 'SpecialSearch'),
    ).toBe(true);
  });

  it('should search by title', async () => {
    const res = await request(app).get('/api/notes?title=SpecialSearch');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body[0].title).toBe('SpecialSearch');
  });

  it('should search by tag', async () => {
    await request(app)
      .post('/api/notes')
      .send({
        title: 'Tagged Note',
        content: 'content',
        tags: ['searchable-tag'],
      });

    const res = await request(app).get('/api/notes?tag=searchable-tag');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(
      res.body.some((n: { title: string }) => n.title === 'Tagged Note'),
    ).toBe(true);
  });
});

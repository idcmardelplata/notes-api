import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import type { Pool } from 'pg';
import { createApp } from '../src/app.js';
import { getTestDb } from './setup.js';

let db: Pool;
let app: ReturnType<typeof createApp>;

beforeAll(async () => {
  db = await getTestDb();
  app = createApp(db);
});

afterAll(async () => {
  await db.end();
});

describe('POST /api/notes', () => {
  it('should create a note', async () => {
    const res = await request(app)
      .post('/api/notes')
      .send({ title: 'Test Note', content: 'Test content', tags: ['test'] })
      .expect(201);

    expect(res.body).toMatchObject({
      title: 'Test Note',
      content: 'Test content',
      tags: ['test'],
    });
    expect(res.body.id).toBeDefined();
    expect(res.body.references).toEqual([]);
    expect(res.body.createdAt).toBeDefined();
    expect(res.body.updatedAt).toBeDefined();
  });

  it('should reject empty title', async () => {
    const res = await request(app)
      .post('/api/notes')
      .send({ title: '', content: 'content' })
      .expect(400);

    expect(res.body.error).toBe('Validation failed');
  });

  it('should reject missing content', async () => {
    const res = await request(app)
      .post('/api/notes')
      .send({ title: 'Title' })
      .expect(400);

    expect(res.body.error).toBe('Validation failed');
  });
});

describe('GET /api/notes', () => {
  it('should return all notes', async () => {
    await request(app)
      .post('/api/notes')
      .send({ title: 'Note A', content: 'Content A' })
      .expect(201);

    await request(app)
      .post('/api/notes')
      .send({ title: 'Note B', content: 'Content B' })
      .expect(201);

    const res = await request(app).get('/api/notes').expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });
});

describe('GET /api/notes/:id', () => {
  it('should return a note by id', async () => {
    const createRes = await request(app)
      .post('/api/notes')
      .send({ title: 'Find me', content: 'I am here' })
      .expect(201);

    const res = await request(app)
      .get(`/api/notes/${createRes.body.id}`)
      .expect(200);

    expect(res.body.title).toBe('Find me');
  });

  it('should return 404 for non-existent note', async () => {
    await request(app)
      .get('/api/notes/non-existent-id')
      .expect(404);
  });
});

describe('PUT /api/notes/:id', () => {
  it('should update a note', async () => {
    const createRes = await request(app)
      .post('/api/notes')
      .send({ title: 'Before', content: 'Before content', tags: ['old'] })
      .expect(201);

    const res = await request(app)
      .put(`/api/notes/${createRes.body.id}`)
      .send({ title: 'After', content: 'After content', tags: ['new'] })
      .expect(200);

    expect(res.body.title).toBe('After');
    expect(res.body.content).toBe('After content');
    expect(res.body.tags).toEqual(['new']);
  });

  it('should return 404 for non-existent note', async () => {
    await request(app)
      .put('/api/notes/non-existent-id')
      .send({ title: 'Noop' })
      .expect(404);
  });
});

describe('DELETE /api/notes/:id', () => {
  it('should delete a note', async () => {
    const createRes = await request(app)
      .post('/api/notes')
      .send({ title: 'Delete me', content: 'Gone soon' })
      .expect(201);

    await request(app)
      .delete(`/api/notes/${createRes.body.id}`)
      .expect(204);

    await request(app)
      .get(`/api/notes/${createRes.body.id}`)
      .expect(404);
  });

  it('should return 404 for non-existent note', async () => {
    await request(app)
      .delete('/api/notes/non-existent-id')
      .expect(404);
  });
});

describe('PATCH /api/notes/:id/references', () => {
  it('should update references across notes', async () => {
    const refA = await request(app)
      .post('/api/notes')
      .send({ title: 'Ref A', content: 'See [[target-id]] for details' })
      .expect(201);

    const refB = await request(app)
      .post('/api/notes')
      .send({ title: 'Ref B', content: 'Also see [[target-id]]' })
      .expect(201);

    const res = await request(app)
      .patch(`/api/notes/${refA.body.id}/references`)
      .send({ oldId: 'target-id', newId: 'new-target-id' })
      .expect(200);

    expect(res.body.affected).toBe(2);

    const updatedA = await request(app)
      .get(`/api/notes/${refA.body.id}`)
      .expect(200);
    expect(updatedA.body.content).toBe('See [[new-target-id]] for details');

    const updatedB = await request(app)
      .get(`/api/notes/${refB.body.id}`)
      .expect(200);
    expect(updatedB.body.content).toBe('Also see [[new-target-id]]');
  });

  it('should reject invalid reference body', async () => {
    await request(app)
      .patch('/api/notes/some-id/references')
      .send({ oldId: '' })
      .expect(400);
  });
});

describe('GET /api/notes?q=&title=&tag=', () => {
  it('should search by query string', async () => {
    const res = await request(app)
      .get('/api/notes?q=Find')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    for (const note of res.body) {
      const match =
        note.title.toLowerCase().includes('find') ||
        note.content.toLowerCase().includes('find');
      expect(match).toBe(true);
    }
  });

  it('should search by title', async () => {
    await request(app)
      .post('/api/notes')
      .send({ title: 'UniqueSearchTitle', content: 'Some content' })
      .expect(201);

    const res = await request(app)
      .get('/api/notes?title=UniqueSearchTitle')
      .expect(200);

    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body[0].title).toBe('UniqueSearchTitle');
  });

  it('should search by tag', async () => {
    await request(app)
      .post('/api/notes')
      .send({ title: 'Tagged Note', content: 'Content', tags: ['search-tag'] })
      .expect(201);

    const res = await request(app)
      .get('/api/notes?tag=search-tag')
      .expect(200);

    expect(res.body.length).toBeGreaterThanOrEqual(1);
    for (const note of res.body) {
      expect(note.tags).toContain('search-tag');
    }
  });
});

import { v4 as uuidv4 } from 'uuid';
import type { Pool } from 'pg';
import {
  rowToNote,
  type Note,
  type NoteRow,
  type CreateNoteDTO,
  type UpdateNoteDTO,
} from '../models/note.js';
import { extractReferences, replaceReference } from '../utils/references.js';

export class NotesService {
  constructor(private db: Pool) {}

  async create(data: CreateNoteDTO): Promise<Note> {
    const id = uuidv4();
    const now = new Date().toISOString();
    const references = extractReferences(data.content);

    await this.db.query(
      `INSERT INTO notes (id, title, content, tags, created_at, updated_at)
       VALUES ($1, $2, $3, $4::jsonb, $5, $6)`,
      [id, data.title, data.content, JSON.stringify(data.tags), now, now],
    );

    return {
      id,
      title: data.title,
      content: data.content,
      tags: data.tags,
      references,
      createdAt: now,
      updatedAt: now,
    };
  }

  async findAll(): Promise<Note[]> {
    const result = await this.db.query(
      'SELECT * FROM notes ORDER BY created_at DESC',
    );
    const notes: Note[] = [];
    for (const row of result.rows) {
      const note = rowToNote(row as unknown as NoteRow);
      note.references = extractReferences(note.content);
      notes.push(note);
    }
    return notes;
  }

  async findById(id: string): Promise<Note | null> {
    const result = await this.db.query(
      'SELECT * FROM notes WHERE id = $1',
      [id],
    );
    if (result.rows.length === 0) return null;
    const row = result.rows[0] as unknown as NoteRow;
    const note = rowToNote(row);
    note.references = extractReferences(note.content);
    return note;
  }

  async search(params: {
    q?: string;
    title?: string;
    tag?: string;
  }): Promise<Note[]> {
    let sql = 'SELECT * FROM notes WHERE 1=1';
    const values: unknown[] = [];
    let paramIndex = 1;

    if (params.q) {
      sql += ` AND (title ILIKE $${paramIndex} OR content ILIKE $${paramIndex})`;
      values.push(`%${params.q}%`);
      paramIndex++;
    }

    if (params.title) {
      sql += ` AND title = $${paramIndex}`;
      values.push(params.title);
      paramIndex++;
    }

    if (params.tag) {
      sql += ` AND tags ? $${paramIndex}`;
      values.push(params.tag);
      paramIndex++;
    }

    sql += ' ORDER BY created_at DESC';

    const result = await this.db.query(sql, values);
    const notes: Note[] = [];
    for (const row of result.rows) {
      const note = rowToNote(row as unknown as NoteRow);
      note.references = extractReferences(note.content);
      notes.push(note);
    }
    return notes;
  }

  async update(id: string, data: UpdateNoteDTO): Promise<Note | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const title = data.title ?? existing.title;
    const content = data.content ?? existing.content;
    const tags = data.tags ?? existing.tags;
    const now = new Date().toISOString();

    await this.db.query(
      `UPDATE notes SET title = $1, content = $2, tags = $3::jsonb, updated_at = $4 WHERE id = $5`,
      [title, content, JSON.stringify(tags), now, id],
    );

    return {
      id,
      title,
      content,
      tags,
      references: extractReferences(content),
      createdAt: existing.createdAt,
      updatedAt: now,
    };
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;

    await this.db.query('DELETE FROM notes WHERE id = $1', [id]);
    return true;
  }

  async updateReferences(oldId: string, newId: string): Promise<number> {
    const result = await this.db.query(
      'SELECT id, content FROM notes WHERE content LIKE $1',
      [`%[[${oldId}]]%`],
    );

    const affected: { id: string; content: string }[] = [];
    for (const row of result.rows) {
      affected.push(row as { id: string; content: string });
    }

    for (const note of affected) {
      const newContent = replaceReference(note.content, oldId, newId);
      await this.db.query(
        'UPDATE notes SET content = $1, updated_at = $2 WHERE id = $3',
        [newContent, new Date().toISOString(), note.id],
      );
    }

    return affected.length;
  }
}

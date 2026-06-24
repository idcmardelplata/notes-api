import { v4 as uuidv4 } from 'uuid';
import type { Database } from 'sql.js';
import {
  rowToNote,
  type Note,
  type NoteRow,
  type CreateNoteDTO,
  type UpdateNoteDTO,
} from '../models/note.js';
import { extractReferences, replaceReference } from '../utils/references.js';
import { saveDatabase } from '../database/connection.js';

export class NotesService {
  constructor(private db: Database) {}

  create(data: CreateNoteDTO): Note {
    const id = uuidv4();
    const now = new Date().toISOString();
    const tags = JSON.stringify(data.tags);
    const references = extractReferences(data.content);

    this.db.run(
      `INSERT INTO notes (id, title, content, tags, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, data.title, data.content, tags, now, now],
    );
    saveDatabase();

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

  findAll(): Note[] {
    const stmt = this.db.prepare(
      'SELECT * FROM notes ORDER BY created_at DESC',
    );
    const notes: Note[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject() as unknown as NoteRow;
      const note = rowToNote(row);
      note.references = extractReferences(note.content);
      notes.push(note);
    }
    stmt.free();
    return notes;
  }

  findById(id: string): Note | null {
    const stmt = this.db.prepare('SELECT * FROM notes WHERE id = ?');
    stmt.bind([id]);
    if (stmt.step()) {
      const row = stmt.getAsObject() as unknown as NoteRow;
      const note = rowToNote(row);
      note.references = extractReferences(note.content);
      stmt.free();
      return note;
    }
    stmt.free();
    return null;
  }

  search(params: { q?: string; title?: string; tag?: string }): Note[] {
    let sql = 'SELECT * FROM notes WHERE 1=1';
    const bindings: unknown[] = [];

    if (params.q) {
      sql += ' AND (title LIKE ? OR content LIKE ?)';
      const like = `%${params.q}%`;
      bindings.push(like, like);
    }

    if (params.title) {
      sql += ' AND title = ?';
      bindings.push(params.title);
    }

    if (params.tag) {
      sql += ' AND tags LIKE ?';
      bindings.push(`%"${params.tag}"%`);
    }

    sql += ' ORDER BY created_at DESC';

    const stmt = this.db.prepare(sql);
    stmt.bind(bindings);
    const notes: Note[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject() as unknown as NoteRow;
      const note = rowToNote(row);
      note.references = extractReferences(note.content);
      notes.push(note);
    }
    stmt.free();
    return notes;
  }

  update(id: string, data: UpdateNoteDTO): Note | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const title = data.title ?? existing.title;
    const content = data.content ?? existing.content;
    const tags = data.tags ?? existing.tags;
    const now = new Date().toISOString();

    this.db.run(
      `UPDATE notes SET title = ?, content = ?, tags = ?, updated_at = ? WHERE id = ?`,
      [title, content, JSON.stringify(tags), now, id],
    );
    saveDatabase();

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

  delete(id: string): boolean {
    const existing = this.findById(id);
    if (!existing) return false;

    this.db.run('DELETE FROM notes WHERE id = ?', [id]);
    saveDatabase();
    return true;
  }

  updateReferences(oldId: string, newId: string): number {
    const stmt = this.db.prepare(
      'SELECT id, content FROM notes WHERE content LIKE ?',
    );
    stmt.bind([`%[[${oldId}]]%`]);
    const affected: { id: string; content: string }[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject() as { id: string; content: string };
      affected.push(row);
    }
    stmt.free();

    for (const note of affected) {
      const newContent = replaceReference(note.content, oldId, newId);
      this.db.run('UPDATE notes SET content = ?, updated_at = ? WHERE id = ?', [
        newContent,
        new Date().toISOString(),
        note.id,
      ]);
    }

    if (affected.length > 0) {
      saveDatabase();
    }

    return affected.length;
  }
}

import type { Request, Response } from 'express';
import { NotesService } from '../services/notes.js';
import {
  CreateNoteSchema,
  UpdateNoteSchema,
  UpdateReferencesSchema,
} from '../models/note.js';
import type { Database } from 'sql.js';

export class NotesController {
  private service: NotesService;

  constructor(db: Database) {
    this.service = new NotesService(db);
  }

  create = (req: Request, res: Response): void => {
    const result = CreateNoteSchema.safeParse(req.body);
    if (!result.success) {
      res
        .status(400)
        .json({ error: 'Validation failed', details: result.error.flatten() });
      return;
    }
    const note = this.service.create(result.data);
    res.status(201).json(note);
  };

  search = (req: Request, res: Response): void => {
    const { q, title, tag } = req.query;
    const notes = this.service.search({
      q: typeof q === 'string' ? q : undefined,
      title: typeof title === 'string' ? title : undefined,
      tag: typeof tag === 'string' ? tag : undefined,
    });
    res.json(notes);
  };

  findById = (req: Request, res: Response): void => {
    const note = this.service.findById(req.params.id);
    if (!note) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }
    res.json(note);
  };

  update = (req: Request, res: Response): void => {
    const result = UpdateNoteSchema.safeParse(req.body);
    if (!result.success) {
      res
        .status(400)
        .json({ error: 'Validation failed', details: result.error.flatten() });
      return;
    }
    const note = this.service.update(req.params.id, result.data);
    if (!note) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }
    res.json(note);
  };

  delete = (req: Request, res: Response): void => {
    const deleted = this.service.delete(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }
    res.status(204).send();
  };

  updateReferences = (req: Request, res: Response): void => {
    const result = UpdateReferencesSchema.safeParse(req.body);
    if (!result.success) {
      res
        .status(400)
        .json({ error: 'Validation failed', details: result.error.flatten() });
      return;
    }
    const affected = this.service.updateReferences(
      result.data.oldId,
      result.data.newId,
    );
    res.json({ affected });
  };
}

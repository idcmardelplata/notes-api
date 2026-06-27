import type { Request, Response } from 'express';
import { NotesService } from '../services/notes.js';
import {
  CreateNoteSchema,
  UpdateNoteSchema,
  UpdateReferencesSchema,
} from '../models/note.js';
import type { Pool } from 'pg';

export class NotesController {
  private service: NotesService;

  constructor(db: Pool) {
    this.service = new NotesService(db);
  }

  create = async (req: Request, res: Response): Promise<void> => {
    const result = CreateNoteSchema.safeParse(req.body);
    if (!result.success) {
      res
        .status(400)
        .json({ error: 'Validation failed', details: result.error.flatten() });
      return;
    }
    const note = await this.service.create(result.data);
    res.status(201).json(note);
  };

  search = async (req: Request, res: Response): Promise<void> => {
    const { q, title, tag } = req.query;
    const notes = await this.service.search({
      q: typeof q === 'string' ? q : undefined,
      title: typeof title === 'string' ? title : undefined,
      tag: typeof tag === 'string' ? tag : undefined,
    });
    res.json(notes);
  };

  findById = async (req: Request, res: Response): Promise<void> => {
    const note = await this.service.findById(req.params.id);
    if (!note) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }
    res.json(note);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const result = UpdateNoteSchema.safeParse(req.body);
    if (!result.success) {
      res
        .status(400)
        .json({ error: 'Validation failed', details: result.error.flatten() });
      return;
    }
    const note = await this.service.update(req.params.id, result.data);
    if (!note) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }
    res.json(note);
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    const deleted = await this.service.delete(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }
    res.status(204).send();
  };

  updateReferences = async (req: Request, res: Response): Promise<void> => {
    const result = UpdateReferencesSchema.safeParse(req.body);
    if (!result.success) {
      res
        .status(400)
        .json({ error: 'Validation failed', details: result.error.flatten() });
      return;
    }
    const affected = await this.service.updateReferences(
      result.data.oldId,
      result.data.newId,
    );
    res.json({ affected });
  };
}

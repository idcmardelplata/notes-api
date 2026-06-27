import { Router } from 'express';
import type { Pool } from 'pg';
import { NotesController } from '../controllers/notes.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export function createNotesRouter(db: Pool): Router {
  const router = Router();
  const ctrl = new NotesController(db);

  router.get('/', asyncHandler(ctrl.search));
  router.get('/:id', asyncHandler(ctrl.findById));
  router.post('/', asyncHandler(ctrl.create));
  router.put('/:id', asyncHandler(ctrl.update));
  router.delete('/:id', asyncHandler(ctrl.delete));
  router.patch('/:id/references', asyncHandler(ctrl.updateReferences));

  return router;
}

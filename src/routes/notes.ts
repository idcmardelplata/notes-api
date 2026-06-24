import { Router } from 'express';
import type { Database } from 'sql.js';
import { NotesController } from '../controllers/notes.js';

export function createNotesRouter(db: Database): Router {
  const router = Router();
  const ctrl = new NotesController(db);

  router.get('/', ctrl.search);
  router.get('/:id', ctrl.findById);
  router.post('/', ctrl.create);
  router.put('/:id', ctrl.update);
  router.delete('/:id', ctrl.delete);
  router.patch('/:id/references', ctrl.updateReferences);

  return router;
}

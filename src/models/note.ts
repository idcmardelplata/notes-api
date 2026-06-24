import { z } from 'zod';

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  references: string[];
  createdAt: string;
  updatedAt: string;
}

export interface NoteRow {
  id: string;
  title: string;
  content: string;
  tags: string;
  created_at: string;
  updated_at: string;
}

export const CreateNoteSchema = z.object({
  title: z.string().min(1).max(500),
  content: z.string().min(1),
  tags: z.array(z.string().max(100)).max(20).optional().default([]),
});

export const UpdateNoteSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  content: z.string().min(1).optional(),
  tags: z.array(z.string().max(100)).max(20).optional(),
});

export const UpdateReferencesSchema = z.object({
  oldId: z.string().min(1),
  newId: z.string().min(1),
});

export type CreateNoteDTO = z.infer<typeof CreateNoteSchema>;
export type UpdateNoteDTO = z.infer<typeof UpdateNoteSchema>;
export type UpdateReferencesDTO = z.infer<typeof UpdateReferencesSchema>;

export function rowToNote(row: NoteRow): Note {
  const parsed = JSON.parse(row.tags) as string[];
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    tags: Array.isArray(parsed) ? parsed : [],
    references: [], // populated separately
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

import { defineCollection } from 'astro:content';
import { sveltiaLoader } from 'astro-loader-sveltia-cms/loader';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Sections collection — the five static sections (Wir, Projekt, Ziele, Termine, Kontakt)
// Using glob loader for file-based collections since sveltiaLoader only supports folder-based
const sections = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/sections' }),
  schema: z.object({
    title: z.string(),
    label: z.string(),
    order: z.number(),
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    body: z.string().optional(), // Optional additional markdown content
  }),
});

// Posts collection — blog posts
const posts = defineCollection({
  loader: sveltiaLoader('posts'),
});

// Site collection — site-wide settings (email, impressum, datenschutz)
const site = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/site' }),
  schema: z.object({
    email: z.string().optional(),
    impressum: z.string().optional(), // Markdown content
    datenschutz: z.string().optional(), // Markdown content
  }),
});

export const collections = { sections, posts, site };

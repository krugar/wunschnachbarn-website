import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
// import { sveltiaLoader } from 'astro-loader-sveltia-cms/loader';

// Sections collection — the five static sections (Wir, Projekt, Ziele, Termine, Kontakt)
const sections = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/sections' }),
  schema: z.object({
    title: z.string(),
    label: z.string(),
    order: z.number(),
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    body: z.string().optional(),
  }),
});

// Posts collection — Blog posts with manual schema
const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    category: z.string(), // Keep string to support custom categories
    excerpt: z.string(),
    heroImage: z.string().optional(),
    heroAlt: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

// Site collection — site-wide settings (email only; legal moved to legal collection)
const site = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/site' }),
  schema: z.object({
    email: z.string().optional(),
  }),
});

// Legal collection — Impressum and Datenschutz (single-sourced, rendered as HTML)
const legal = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/legal' }),
  schema: z.object({
    title: z.string(),
  }),
});

export const collections = { sections, posts, site, legal };

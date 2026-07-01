// @ts-check
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import sveltia from 'astro-loader-sveltia-cms';

// https://astro.build/config
export default defineConfig({
  // Base path for GitHub Pages deployment
  // Site will be available at: https://krugar.github.io/wunschnachbarn-website/
  // For local development (localhost:4321), this can be '/' or left undefined
  base: '/wunschnachbarn-website',

  // Image service (built into Astro 7+)
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
    },
  },
  integrations: [
    svelte(),
    sveltia({
      route: '/admin',
      title: 'Wunschnachbarn CMS',
      config: {
        backend: {
          name: 'github',
          repo: 'krugar/wunschnachbarn-website',
          branch: 'main',
        },
        media_folder: 'src/assets/uploads',
        public_folder: '/src/assets/uploads',
        collections: [
          {
            name: 'sections',
            label: 'Statische Bereiche',
            files: [
              {
                name: 'wir',
                label: 'Wir',
                file: 'src/content/sections/wir.md',
                fields: [
                  { name: 'title', label: 'Titel', widget: 'string' },
                  { name: 'label', label: 'Menü-Label', widget: 'string' },
                  { name: 'order', label: 'Reihenfolge', widget: 'number' },
                  { name: 'image', label: 'Bild', widget: 'image', required: false },
                  { name: 'imageAlt', label: 'Bild-Alt-Text', widget: 'string', required: false },
                  { name: 'body', label: 'Text', widget: 'markdown' },
                ],
              },
              {
                name: 'projekt',
                label: 'Projekt',
                file: 'src/content/sections/projekt.md',
                fields: [
                  { name: 'title', label: 'Titel', widget: 'string' },
                  { name: 'label', label: 'Menü-Label', widget: 'string' },
                  { name: 'order', label: 'Reihenfolge', widget: 'number' },
                  { name: 'image', label: 'Bild', widget: 'image', required: false },
                  { name: 'imageAlt', label: 'Bild-Alt-Text', widget: 'string', required: false },
                  { name: 'body', label: 'Text', widget: 'markdown' },
                ],
              },
              {
                name: 'ziele',
                label: 'Ziele',
                file: 'src/content/sections/ziele.md',
                fields: [
                  { name: 'title', label: 'Titel', widget: 'string' },
                  { name: 'label', label: 'Menü-Label', widget: 'string' },
                  { name: 'order', label: 'Reihenfolge', widget: 'number' },
                  { name: 'image', label: 'Bild', widget: 'image', required: false },
                  { name: 'imageAlt', label: 'Bild-Alt-Text', widget: 'string', required: false },
                  { name: 'body', label: 'Text', widget: 'markdown' },
                ],
              },
              {
                name: 'termine',
                label: 'Termine',
                file: 'src/content/sections/termine.md',
                fields: [
                  { name: 'title', label: 'Titel', widget: 'string' },
                  { name: 'label', label: 'Menü-Label', widget: 'string' },
                  { name: 'order', label: 'Reihenfolge', widget: 'number' },
                  { name: 'image', label: 'Bild', widget: 'image', required: false },
                  { name: 'imageAlt', label: 'Bild-Alt-Text', widget: 'string', required: false },
                  { name: 'body', label: 'Text', widget: 'markdown' },
                ],
              },
              {
                name: 'kontakt',
                label: 'Kontakt',
                file: 'src/content/sections/kontakt.md',
                fields: [
                  { name: 'title', label: 'Titel', widget: 'string' },
                  { name: 'label', label: 'Menü-Label', widget: 'string' },
                  { name: 'order', label: 'Reihenfolge', widget: 'number' },
                  { name: 'body', label: 'Text', widget: 'markdown' },
                ],
              },
            ],
          },
          {
            name: 'posts',
            label: 'Blog',
            folder: 'src/content/posts',
            create: true,
            slug: '{{slug}}',
            fields: [
              { name: 'title', label: 'Titel', widget: 'string' },
              { name: 'date', label: 'Datum', widget: 'datetime' },
              { name: 'category', label: 'Kategorie', widget: 'select', options: ['Gemeinschaft', 'Bauphase', 'Wald', 'Soziokratie'] },
              { name: 'excerpt', label: 'Anriss', widget: 'text' },
              { name: 'heroImage', label: 'Titelbild', widget: 'image', required: false },
              { name: 'heroAlt', label: 'Bild-Alt', widget: 'string', required: false },
              { name: 'draft', label: 'Entwurf', widget: 'boolean', default: false, required: false },
              { name: 'body', label: 'Beitrag', widget: 'markdown' },
            ],
          },
          {
            name: 'site',
            label: 'Seiteneinstellungen',
            files: [
              {
                name: 'meta',
                label: 'Allgemein',
                file: 'src/content/site/meta.md',
                fields: [
                  { name: 'email', label: 'Kontakt-E-Mail', widget: 'string' },
                  { name: 'impressum', label: 'Impressum', widget: 'markdown' },
                  { name: 'datenschutz', label: 'Datenschutz', widget: 'markdown' },
                ],
              },
            ],
          },
        ],
      },
    }),],
});
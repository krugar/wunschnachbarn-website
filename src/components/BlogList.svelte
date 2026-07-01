<script lang="ts">
  interface ImageResult {
    src: string;
    width: number;
    height: number;
    format: string;
  }

  interface BlogPost {
    id: number;
    slug: string;
    date: string;
    category: string;
    title: string;
    excerpt: string;
    heroImage?: ImageResult | null;
    heroAlt?: string;
  }

  interface Props {
    posts: BlogPost[];
    categories: string[];
  }

  let { posts, categories }: Props = $props();

  // Import buildUrl for base path handling
  import { buildUrl } from '../lib/band-state.js';

  // State: active category filter
  let activeCategory = $state('Alle');

  // State: search query
  let searchQuery = $state('');

  // Computed: filtered posts
  const filteredPosts = $derived.by(() => {
    return posts.filter(post => {
      // Category filter
      const categoryMatch = activeCategory === 'Alle' || post.category === activeCategory;

      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const searchMatch =
        searchQuery === '' ||
        post.title.toLowerCase().includes(searchLower) ||
        post.excerpt.toLowerCase().includes(searchLower);

      return categoryMatch && searchMatch;
    });
  });

  // Handle category change
  function handleCategoryChange(category: string) {
    activeCategory = category;
  }

  // Handle search input
  function handleSearchInput(event: Event) {
    const target = event.target as HTMLInputElement;
    searchQuery = target.value;
  }
</script>

<section class="blog-list">
  <!-- Search and filter controls -->
  <div class="blog-controls">
    <label class="search">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-5-5" />
      </svg>
      <input
        type="search"
        placeholder="Beiträge durchsuchen…"
        value={searchQuery}
        oninput={handleSearchInput}
        aria-label="Beiträge durchsuchen"
      />
    </label>

    <div class="categories" role="tablist" aria-label="Blog-Kategorien">
      {#each categories as category}
        <button
          class:active={activeCategory === category}
          role="tab"
          aria-selected={activeCategory === category}
          aria-controls="blog-posts"
          onclick={() => handleCategoryChange(category)}
        >
          {category}
        </button>
      {/each}
    </div>
  </div>

  <!-- Posts list -->
  <div id="blog-posts" role="tabpanel" class="blog-posts">
    {#if filteredPosts.length === 0}
      <p class="no-results">
        Keine Beiträge gefunden. Versuche eine andere Suche oder Kategorie.
      </p>
    {:else}
      {#each filteredPosts as post}
        <article class="blog-post">
          <a href={buildUrl(`/blog/${post.slug}`)} class="post-link">
            <div class="post-thumb">
              {#if post.heroImage}
                <img
                  src={post.heroImage.src}
                  width={post.heroImage.width}
                  height={post.heroImage.height}
                  alt={post.heroAlt || post.title}
                  loading="lazy"
                  decoding="async"
                />
              {:else}
                <span class="thumb-label">Foto</span>
              {/if}
            </div>
            <div class="post-content">
              <div class="post-meta">
                <time class="post-date">{post.date}</time>
                <span class="post-category">{post.category}</span>
              </div>
              <h2 class="post-title">{post.title}</h2>
              <p class="post-excerpt">{post.excerpt}</p>
              <span class="read-more">Weiterlesen →</span>
            </div>
          </a>
        </article>
      {/each}
    {/if}
  </div>
</section>

<style>
  .blog-controls {
    display: flex;
    flex-direction: column;
    gap: var(--sp-5);
    margin-bottom: var(--sp-8);
  }

  .search {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    padding: var(--sp-3) var(--sp-4);
    background: var(--wn-mint-100);
    border: 2px solid transparent;
    border-radius: var(--r-md);
    transition: border-color var(--dur-2) var(--ease-out);
  }

  .search:focus-within {
    border-color: var(--wn-violet);
  }

  .search svg {
    flex-shrink: 0;
    color: var(--wn-graphite);
  }

  .search input {
    flex: 1;
    background: none;
    border: none;
    font-size: var(--fs-body);
    font-family: var(--ff-text);
    color: var(--fg);
    outline: none;
  }

  .search input::placeholder {
    color: var(--fg-soft);
  }

  .categories {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
  }

  .categories button {
    padding: var(--sp-2) var(--sp-4);
    font-size: var(--fs-small);
    font-weight: 600;
    font-family: var(--ff-text);
    color: var(--fg);
    background: var(--wn-mint-100);
    border: 2px solid transparent;
    border-radius: var(--r-pill);
    cursor: pointer;
    transition: all var(--dur-2) var(--ease-out);
  }

  .categories button:hover {
    background: var(--wn-mint-200);
    border-color: var(--wn-violet-soft);
  }

  .categories button.active {
    background: var(--wn-violet);
    color: var(--wn-paper);
    border-color: var(--wn-violet);
  }

  .categories button:focus-visible {
    outline: 2px solid var(--focus-ring);
    outline-offset: 2px;
  }

  .blog-posts {
    display: flex;
    flex-direction: column;
    gap: var(--sp-6);
  }

  .no-results {
    text-align: center;
    padding: var(--sp-10) var(--sp-5);
    font-size: var(--fs-body-lg);
    color: var(--fg-soft);
    font-style: italic;
  }

  .blog-post {
    background: var(--wn-paper);
    border-radius: var(--r-lg);
    overflow: hidden;
    transition: transform var(--dur-2) var(--ease-out),
                box-shadow var(--dur-2) var(--ease-out);
  }

  .blog-post:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-2);
  }

  .post-link {
    display: flex;
    gap: var(--sp-5);
    padding: var(--sp-5);
    text-decoration: none;
    color: inherit;
  }

  .post-thumb {
    flex-shrink: 0;
    width: 120px;
    height: 120px;
    background: var(--wn-mint-200);
    background-image: url("../assets/design-system/forest-texture.png");
    background-size: 500px auto;
    background-repeat: repeat;
    border-radius: var(--r-md);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .post-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .thumb-label {
    font-family: var(--ff-display);
    font-weight: 700;
    font-size: var(--fs-small);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--wn-graphite);
  }

  .post-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--sp-3);
  }

  .post-meta {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    font-size: var(--fs-small);
  }

  .post-date {
    color: var(--wn-graphite);
  }

  .post-category {
    padding: var(--sp-1) var(--sp-3);
    background: var(--wn-mint-100);
    border-radius: var(--r-pill);
    font-size: 13px;
    font-weight: 600;
    color: var(--wn-violet);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .post-title {
    font-size: var(--fs-h3);
    font-weight: 700;
    margin: 0;
    color: var(--wn-green-deep);
    transition: color var(--dur-2) var(--ease-out);
  }

  .blog-post:hover .post-title {
    color: var(--wn-violet);
  }

  .post-excerpt {
    font-size: var(--fs-body);
    color: var(--fg-muted);
    margin: 0;
    line-height: var(--lh-normal);
  }

  .read-more {
    display: inline-flex;
    align-items: center;
    font-size: var(--fs-small);
    font-weight: 600;
    color: var(--wn-violet);
    margin-top: auto;
    transition: color var(--dur-2) var(--ease-out),
                transform var(--dur-1) var(--ease-out);
  }

  .blog-post:hover .read-more {
    color: var(--wn-orange);
    transform: translateX(4px);
  }

  @media (max-width: 768px) {
    .blog-controls {
      gap: var(--sp-4);
    }

    .post-link {
      flex-direction: column;
      gap: var(--sp-4);
    }

    .post-thumb {
      width: 100%;
      height: 160px;
    }
  }
</style>

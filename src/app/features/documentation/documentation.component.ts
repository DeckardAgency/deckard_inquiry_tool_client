import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { DocumentationService } from '@services/http/documentation.service';
import { Documentation, DocumentationMedia, DocumentationSection } from '@models/documentation.model';

@Component({
  selector: 'app-documentation',
  imports: [CommonModule, RouterModule],
  templateUrl: './documentation.component.html',
  styleUrl: './documentation.component.scss'
})
export class DocumentationComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);
  private documentationService = inject(DocumentationService);

  // State signals
  currentSlug = signal<string>('basic');
  content = signal<SafeHtml>('');
  loading = signal<boolean>(true);
  error = signal<string>('');
  isSidebarOpen = signal<boolean>(true);
  expandedSections = signal<Set<string>>(new Set());

  // Documentation data
  documentations = signal<Documentation[]>([]);
  sections = signal<DocumentationSection[]>([]);

  // Current documentation title for display
  currentTitle = computed(() => {
    const slug = this.currentSlug();
    const doc = this.documentations().find(d => d.slug === slug);
    return doc?.title || 'Documentation';
  });

  ngOnInit(): void {
    // Load all documentations first
    this.loadDocumentations();

    // Subscribe to route changes
    this.route.params.subscribe(params => {
      const page = params['page'] || 'basic';
      this.currentSlug.set(page);
      this.loadDocumentationContent(page);
    });
  }

  /**
   * Load all published documentations to build navigation
   */
  private loadDocumentations(): void {
    this.documentationService.getPublishedDocumentations().subscribe({
      next: (docs) => {
        this.documentations.set(docs);
        const navSections = this.documentationService.buildNavigationSections(docs);
        this.sections.set(navSections);

        // Auto-expand sections that have the current page
        this.expandSectionContainingSlug(this.currentSlug());
      },
      error: (err) => {
        console.error('Error loading documentations:', err);
      }
    });
  }

  /**
   * Load documentation content by slug
   */
  private loadDocumentationContent(slug: string): void {
    this.loading.set(true);
    this.error.set('');

    this.documentationService.getDocumentationBySlug(slug).subscribe({
      next: (doc) => {
        if (doc) {
          // Build media map for placeholder resolution
          const mediaMap = this.documentationService.buildMediaMap(doc.media);
          const html = this.convertMarkdownToHtml(doc.content, mediaMap);
          this.content.set(this.sanitizer.bypassSecurityTrustHtml(html));
          this.loading.set(false);
        } else {
          this.error.set(`Documentation page "${slug}" not found.`);
          this.loading.set(false);
        }
      },
      error: (err) => {
        console.error('Error loading documentation:', err);
        this.error.set(`Documentation page "${slug}" not found. Please check back later.`);
        this.loading.set(false);
      }
    });
  }

  /**
   * Convert markdown to HTML
   * @param markdown The markdown content
   * @param mediaMap Optional map of filename to URL for resolving {{media:filename}} placeholders
   */
  convertMarkdownToHtml(markdown: string, mediaMap?: Map<string, string>): string {
    let html = markdown;

    // Resolve {{media:filename}} placeholders first
    if (mediaMap && mediaMap.size > 0) {
      html = html.replace(/\{\{media:([^}]+)\}\}/g, (match, filename) => {
        const url = mediaMap.get(filename);
        if (url) {
          return `<img src="${url}" alt="${filename}" class="doc-image" style="max-width: 100%; height: auto;">`;
        }
        // If media not found, return placeholder text
        return `[Image: ${filename}]`;
      });
    }

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');

    // Italic
    html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');

    // Images (must be processed before links) - for standard markdown images
    html = html.replace(/!\[([^\]]+)\]\(([^)]+)\)/gim, '<img src="assets/docs/$2" alt="$1" width="100%" class="doc-image">');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>');

    // Code blocks
    html = html.replace(/```([^`]+)```/gim, '<pre><code>$1</code></pre>');

    // Inline code
    html = html.replace(/`([^`]+)`/gim, '<code>$1</code>');

    // Lists
    html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/gim, '<ul>$1</ul>');

    // Line breaks
    html = html.replace(/\n\n/g, '</p><p>');
    html = '<p>' + html + '</p>';

    return html;
  }

  /**
   * Navigate to a documentation page
   */
  navigateToPage(slug: string): void {
    if (slug) {
      this.router.navigate(['/documentation', slug]);
    }
  }

  /**
   * Navigate back to dashboard
   */
  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  /**
   * Toggle section expansion
   */
  toggleSection(sectionId: string): void {
    const expanded = new Set(this.expandedSections());
    if (expanded.has(sectionId)) {
      expanded.delete(sectionId);
    } else {
      expanded.add(sectionId);
    }
    this.expandedSections.set(expanded);
  }

  /**
   * Check if section is expanded
   */
  isSectionExpanded(sectionId: string): boolean {
    return this.expandedSections().has(sectionId);
  }

  /**
   * Toggle sidebar visibility
   */
  toggleSidebar(): void {
    this.isSidebarOpen.set(!this.isSidebarOpen());
  }

  /**
   * Check if page is active
   */
  isActivePage(slug: string): boolean {
    return this.currentSlug() === slug;
  }

  /**
   * Auto-expand section containing a specific slug
   */
  private expandSectionContainingSlug(slug: string): void {
    const sections = this.sections();
    for (const section of sections) {
      if (section.subsections) {
        const hasSlug = section.subsections.some(sub => sub.slug === slug);
        if (hasSlug) {
          const expanded = new Set(this.expandedSections());
          expanded.add(section.id);
          this.expandedSections.set(expanded);
          break;
        }
      }
    }
  }

  /**
   * Get the first available documentation slug for fallback
   */
  getFirstDocSlug(): string {
    const docs = this.documentations();
    if (docs.length > 0) {
      return docs[0].slug;
    }
    return 'basic';
  }
}

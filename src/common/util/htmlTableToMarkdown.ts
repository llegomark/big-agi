/**
 * @fileoverview Utility functions for Markdown.
 */

/**
 * Quick and dirty conversion of HTML tables to Markdown tables.
 * Big plus: doesn't require any dependencies.
 */
export function htmlTableToMarkdown(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const tables = doc.querySelectorAll('table');
  if (tables.length === 0) throw new Error('No tables found in HTML string.');

  return Array.from(tables)
    .map((table) => convertTable(table))
    .join('\n\n');
}

function convertTable(table: HTMLTableElement): string {
  const markdownRows: string[] = [];

  // Assert the correct type for headerCells and rowCells
  const headerCells =
    (table.querySelectorAll('thead th') as NodeListOf<HTMLTableCellElement>) || (table.querySelectorAll('tbody th') as NodeListOf<HTMLTableCellElement>);
  const separatorRow = headerCells.length > 0 ? generateSeparatorRow(headerCells) : '';

  const bodyRows = table.querySelectorAll('tbody tr');
  for (const row of Array.from(bodyRows)) {
    const rowCells = row.querySelectorAll('td, th') as NodeListOf<HTMLTableCellElement>;
    const markdownRow = generateMarkdownRow(rowCells);
    markdownRows.push(markdownRow);
  }

  return [generateMarkdownRow(headerCells), separatorRow, ...markdownRows].join('\n').trim();
}

function generateSeparatorRow(headerCells: NodeListOf<HTMLTableCellElement>): string {
  // Consider adding logic to detect and apply column alignments
  return '|:' + Array(headerCells.length).fill('---').join(':|:') + ':|';
}

function generateMarkdownRow(cells: NodeListOf<HTMLTableCellElement>): string {
  return (
    '| ' +
    Array.from(cells)
      .map((cell) => escapeMarkdown(cell.textContent?.trim() || ''))
      .join(' | ') +
    ' |'
  );
}

function escapeMarkdown(text: string): string {
  // Add more escape sequences as needed
  return text.replace(/\|/g, '\\|');
}

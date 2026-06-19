// Renders one or more JSON-LD structured-data blocks. Server component — the
// script ships in the initial HTML so crawlers see it without running JS.
// schema.org markup powers rich results (breadcrumbs, sitelinks searchbox, etc.).

export function JsonLd({ data }: { data: object | object[] }) {
  const blocks = Array.isArray(data) ? data : [data];
  return (
    <>
      {blocks.map((block, i) => (
        <script
          key={i}
          type="application/ld+json"
          // Data is built from our own DB content; JSON.stringify escapes it.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}
    </>
  );
}

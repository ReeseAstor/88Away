import htmlPdf from 'html-pdf-node';
import archiver from 'archiver';
import { Readable } from 'stream';
import { ProjectWithCollaborators } from '@shared/schema';

interface ExportData {
  project: {
    title: string;
    description: string | null;
    genre: string | null;
    targetWordCount?: number | null;
    currentWordCount?: number | null;
  };
  characters: any[];
  worldbuilding: any[];
  timeline: any[];
  documents: any[];
  exportedAt: string;
}

export class ExportGenerator {
  static async generateHTML(data: ExportData): Promise<string> {
    const { project, characters, worldbuilding, timeline, documents } = data;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.title}</title>
  <style>
    body {
      font-family: 'Times New Roman', serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      color: #333;
    }
    h1 {
      color: #1a1a1a;
      border-bottom: 2px solid #333;
      padding-bottom: 10px;
      margin-bottom: 30px;
    }
    h2 {
      color: #444;
      margin-top: 40px;
      margin-bottom: 20px;
      border-left: 4px solid #007acc;
      padding-left: 15px;
    }
    h3 {
      color: #666;
      margin-top: 30px;
      margin-bottom: 15px;
    }
    .metadata {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    .character, .worldbuilding-entry, .timeline-event, .document {
      background: #fff;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .character-name, .entry-name, .event-title, .document-title {
      font-weight: bold;
      font-size: 1.2em;
      margin-bottom: 10px;
      color: #007acc;
    }
    .description, .content {
      margin-bottom: 15px;
    }
    .tags {
      margin-top: 10px;
    }
    .tag {
      display: inline-block;
      background: #e3f2fd;
      color: #1976d2;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.9em;
      margin-right: 8px;
      margin-bottom: 4px;
    }
    .stats {
      display: flex;
      gap: 20px;
      margin-bottom: 20px;
    }
    .stat {
      background: #f0f0f0;
      padding: 10px;
      border-radius: 4px;
      text-align: center;
    }
    .document-content {
      white-space: pre-wrap;
      font-family: 'Georgia', serif;
      line-height: 1.8;
    }
  </style>
</head>
<body>
  <h1>${project.title}</h1>
  
  <div class="metadata">
    <div class="stats">
      ${project.currentWordCount !== undefined && project.currentWordCount !== null ? `<div class="stat"><strong>${project.currentWordCount.toLocaleString()}</strong><br>Current Words</div>` : ''}
      ${project.targetWordCount !== undefined && project.targetWordCount !== null ? `<div class="stat"><strong>${project.targetWordCount.toLocaleString()}</strong><br>Target Words</div>` : ''}
      <div class="stat"><strong>${characters.length}</strong><br>Characters</div>
      <div class="stat"><strong>${documents.length}</strong><br>Documents</div>
    </div>
    
    ${project.description ? `<h3>Description</h3><p>${project.description}</p>` : ''}
    ${project.genre ? `<p><strong>Genre:</strong> ${project.genre}</p>` : ''}
  </div>

  ${characters.length > 0 ? `
  <h2>Characters</h2>
  ${characters.map(char => `
    <div class="character">
      <div class="character-name">${char.name}</div>
      ${char.description ? `<div class="description">${char.description}</div>` : ''}
      ${char.background ? `<p><strong>Background:</strong> ${char.background}</p>` : ''}
      ${char.personality ? `<p><strong>Personality:</strong> ${char.personality}</p>` : ''}
      ${char.appearance ? `<p><strong>Appearance:</strong> ${char.appearance}</p>` : ''}
      ${char.notes ? `<p><strong>Notes:</strong> ${char.notes}</p>` : ''}
    </div>
  `).join('')}
  ` : ''}

  ${worldbuilding.length > 0 ? `
  <h2>World Building</h2>
  ${worldbuilding.map(entry => `
    <div class="worldbuilding-entry">
      <div class="entry-name">${entry.name}</div>
      ${entry.description ? `<div class="description">${entry.description}</div>` : ''}
      ${entry.category ? `<p><strong>Category:</strong> ${entry.category}</p>` : ''}
      ${entry.tags && entry.tags.length > 0 ? `
        <div class="tags">
          ${entry.tags.map((tag: string) => `<span class="tag">${tag}</span>`).join('')}
        </div>
      ` : ''}
    </div>
  `).join('')}
  ` : ''}

  ${timeline.length > 0 ? `
  <h2>Timeline</h2>
  ${timeline.map(event => `
    <div class="timeline-event">
      <div class="event-title">${event.title}</div>
      ${event.description ? `<div class="description">${event.description}</div>` : ''}
      ${event.date ? `<p><strong>Date:</strong> ${event.date}</p>` : ''}
      ${event.category ? `<p><strong>Category:</strong> ${event.category}</p>` : ''}
    </div>
  `).join('')}
  ` : ''}

  ${documents.length > 0 ? `
  <h2>Documents</h2>
  ${documents.map(doc => `
    <div class="document">
      <div class="document-title">${doc.title}</div>
      ${doc.content ? `<div class="document-content">${doc.content}</div>` : ''}
    </div>
  `).join('')}
  ` : ''}

  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 0.9em;">
    Exported from WriteCraft Pro on ${new Date(data.exportedAt).toLocaleDateString()}
  </div>
</body>
</html>`;
  }

  static async generatePDF(data: ExportData): Promise<Buffer> {
    const html = await this.generateHTML(data);
    
    const options = {
      format: 'A4',
      margin: {
        top: '1in',
        right: '1in',
        bottom: '1in',
        left: '1in'
      },
      printBackground: true,
      preferCSSPageSize: true
    };

    try {
      const file = { content: html };
      const pdfBuffer = await htmlPdf.generatePdf(file, options);
      return pdfBuffer as Buffer;
    } catch (error) {
      console.error('PDF generation error:', error);
      // Fallback: return HTML as text if PDF generation fails
      throw new Error('PDF generation failed. Please try again or contact support.');
    }
  }

  static async generateEPub(data: ExportData): Promise<Buffer> {
    const { project, characters, worldbuilding, timeline, documents } = data;
    
    return new Promise<Buffer>((resolve, reject) => {
      const archive = archiver('zip', {
        zlib: { level: 9 }
      });
      
      const chunks: Buffer[] = [];
      
      archive.on('data', (chunk) => {
        chunks.push(chunk);
      });
      
      archive.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      
      archive.on('error', (err) => {
        reject(err);
      });

      // Required ePub structure
      
      // 1. mimetype file (must be first and uncompressed)
      archive.append('application/epub+zip', { name: 'mimetype', store: true });
      
      // 2. META-INF/container.xml
      const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
      archive.append(containerXml, { name: 'META-INF/container.xml' });
      
      // 3. Content.opf (package document)
      const contentOpf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:identifier id="BookId">${project.title.replace(/[^a-zA-Z0-9]/g, '')}_${Date.now()}</dc:identifier>
    <dc:title>${project.title}</dc:title>
    <dc:creator>WriteCraft Pro Export</dc:creator>
    <dc:language>en</dc:language>
    <dc:date>${new Date().toISOString().split('T')[0]}</dc:date>
    ${project.description ? `<dc:description>${project.description}</dc:description>` : ''}
    <dc:publisher>WriteCraft Pro</dc:publisher>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="stylesheet" href="styles.css" media-type="text/css"/>
    <item id="overview" href="overview.xhtml" media-type="application/xhtml+xml"/>
    ${characters.length > 0 ? '<item id="characters" href="characters.xhtml" media-type="application/xhtml+xml"/>' : ''}
    ${worldbuilding.length > 0 ? '<item id="worldbuilding" href="worldbuilding.xhtml" media-type="application/xhtml+xml"/>' : ''}
    ${timeline.length > 0 ? '<item id="timeline" href="timeline.xhtml" media-type="application/xhtml+xml"/>' : ''}
    ${documents.map((doc, index) => `<item id="doc${index}" href="document_${index}.xhtml" media-type="application/xhtml+xml"/>`).join('\n    ')}
  </manifest>
  <spine toc="ncx">
    <itemref idref="overview"/>
    ${characters.length > 0 ? '<itemref idref="characters"/>' : ''}
    ${worldbuilding.length > 0 ? '<itemref idref="worldbuilding"/>' : ''}
    ${timeline.length > 0 ? '<itemref idref="timeline"/>' : ''}
    ${documents.map((doc, index) => `<itemref idref="doc${index}"/>`).join('\n    ')}
  </spine>
</package>`;
      archive.append(contentOpf, { name: 'OEBPS/content.opf' });
      
      // 4. Table of Contents (toc.ncx)
      const tocNcx = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${project.title.replace(/[^a-zA-Z0-9]/g, '')}_${Date.now()}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle>
    <text>${project.title}</text>
  </docTitle>
  <navMap>
    <navPoint id="navpoint-1" playOrder="1">
      <navLabel><text>Overview</text></navLabel>
      <content src="overview.xhtml"/>
    </navPoint>
    ${characters.length > 0 ? `
    <navPoint id="navpoint-2" playOrder="2">
      <navLabel><text>Characters</text></navLabel>
      <content src="characters.xhtml"/>
    </navPoint>` : ''}
    ${worldbuilding.length > 0 ? `
    <navPoint id="navpoint-3" playOrder="3">
      <navLabel><text>World Building</text></navLabel>
      <content src="worldbuilding.xhtml"/>
    </navPoint>` : ''}
    ${timeline.length > 0 ? `
    <navPoint id="navpoint-4" playOrder="4">
      <navLabel><text>Timeline</text></navLabel>
      <content src="timeline.xhtml"/>
    </navPoint>` : ''}
    ${documents.map((doc, index) => `
    <navPoint id="navpoint-${5 + index}" playOrder="${5 + index}">
      <navLabel><text>${doc.title}</text></navLabel>
      <content src="document_${index}.xhtml"/>
    </navPoint>`).join('')}
  </navMap>
</ncx>`;
      archive.append(tocNcx, { name: 'OEBPS/toc.ncx' });
      
      // 5. CSS Styles
      const styles = `
body {
  font-family: Georgia, serif;
  line-height: 1.6;
  margin: 20px;
  color: #333;
}
h1 {
  color: #1a1a1a;
  border-bottom: 2px solid #333;
  padding-bottom: 10px;
  margin-bottom: 20px;
}
h2 {
  color: #444;
  margin-top: 30px;
  margin-bottom: 15px;
}
h3 {
  color: #666;
  margin-top: 20px;
  margin-bottom: 10px;
}
.metadata {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 5px;
  margin-bottom: 20px;
}
.character, .entry, .event {
  border: 1px solid #e0e0e0;
  border-radius: 5px;
  padding: 15px;
  margin-bottom: 15px;
}
.name {
  font-weight: bold;
  color: #007acc;
  font-size: 1.1em;
  margin-bottom: 8px;
}
`;
      archive.append(styles, { name: 'OEBPS/styles.css' });
      
      // 6. XHTML Content Files
      
      // Overview
      let overviewContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${project.title}</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
  <h1>${project.title}</h1>
  ${project.description ? `<p>${project.description}</p>` : ''}
  ${project.genre ? `<p><strong>Genre:</strong> ${project.genre}</p>` : ''}
  <div class="metadata">
    ${project.currentWordCount !== undefined && project.currentWordCount !== null ? `<p><strong>Current Words:</strong> ${project.currentWordCount.toLocaleString()}</p>` : ''}
    ${project.targetWordCount !== undefined && project.targetWordCount !== null ? `<p><strong>Target Words:</strong> ${project.targetWordCount.toLocaleString()}</p>` : ''}
    <p><strong>Characters:</strong> ${characters.length}</p>
    <p><strong>Documents:</strong> ${documents.length}</p>
  </div>
</body>
</html>`;
      archive.append(overviewContent, { name: 'OEBPS/overview.xhtml' });
      
      // Characters
      if (characters.length > 0) {
        let charactersContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Characters</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
  <h1>Characters</h1>
  ${characters.map(char => `
  <div class="character">
    <div class="name">${char.name}</div>
    ${char.description ? `<p>${char.description}</p>` : ''}
    ${char.background ? `<p><strong>Background:</strong> ${char.background}</p>` : ''}
    ${char.personality ? `<p><strong>Personality:</strong> ${char.personality}</p>` : ''}
    ${char.appearance ? `<p><strong>Appearance:</strong> ${char.appearance}</p>` : ''}
    ${char.notes ? `<p><strong>Notes:</strong> ${char.notes}</p>` : ''}
  </div>
  `).join('')}
</body>
</html>`;
        archive.append(charactersContent, { name: 'OEBPS/characters.xhtml' });
      }
      
      // World Building
      if (worldbuilding.length > 0) {
        let worldbuildingContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>World Building</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
  <h1>World Building</h1>
  ${worldbuilding.map(entry => `
  <div class="entry">
    <div class="name">${entry.name}</div>
    ${entry.description ? `<p>${entry.description}</p>` : ''}
    ${entry.category ? `<p><strong>Category:</strong> ${entry.category}</p>` : ''}
    ${entry.tags && entry.tags.length > 0 ? `<p><strong>Tags:</strong> ${entry.tags.join(', ')}</p>` : ''}
  </div>
  `).join('')}
</body>
</html>`;
        archive.append(worldbuildingContent, { name: 'OEBPS/worldbuilding.xhtml' });
      }
      
      // Timeline
      if (timeline.length > 0) {
        let timelineContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Timeline</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
  <h1>Timeline</h1>
  ${timeline.map(event => `
  <div class="event">
    <div class="name">${event.title}</div>
    ${event.description ? `<p>${event.description}</p>` : ''}
    ${event.date ? `<p><strong>Date:</strong> ${event.date}</p>` : ''}
    ${event.category ? `<p><strong>Category:</strong> ${event.category}</p>` : ''}
  </div>
  `).join('')}
</body>
</html>`;
        archive.append(timelineContent, { name: 'OEBPS/timeline.xhtml' });
      }
      
      // Documents
      documents.forEach((doc, index) => {
        const documentContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${doc.title}</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
  <h1>${doc.title}</h1>
  ${doc.content ? `<div style="white-space: pre-wrap;">${doc.content}</div>` : ''}
</body>
</html>`;
        archive.append(documentContent, { name: `OEBPS/document_${index}.xhtml` });
      });
      
      archive.finalize();
    });
  }
}
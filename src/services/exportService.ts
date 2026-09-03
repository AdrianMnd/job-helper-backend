import PDFDocument from 'pdfkit';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';

export interface ParsedCv {
  fullName: string;
  headline: string;
  summary: string;
  skillGroups: { category: string; skills: string[] }[];
  experience: { role: string; company: string; period: string; bullets: string[] }[];
  education: { degree: string; institution: string; period: string }[];
}

// Interpreta el contenido guardado en GeneratedDocument, tolerando las
// distintas formas de schema que fue teniendo el CV durante la sesion de
// prompt engineering (misma logica defensiva que CvDocument.tsx en el
// frontend - duplicada aqui a proposito, porque backend y frontend son
// despliegues independientes sin paquete compartido entre ambos).
export function parseCvContent(raw: string): ParsedCv {
  let data: any;
  try {
    data = JSON.parse(raw);
  } catch {
    return { fullName: '', headline: '', summary: raw, skillGroups: [], experience: [], education: [] };
  }

  const skillGroups =
    data.skillGroups ?? (data.highlightedSkills ? [{ category: 'Skills', skills: data.highlightedSkills }] : []);

  const experience = (data.experience ?? []).map((exp: any) => ({
    role: exp.role ?? '',
    company: exp.company ?? '',
    period: exp.period ?? '',
    bullets: exp.bullets ?? (exp.adaptedDescription ? [exp.adaptedDescription] : []),
  }));

  return {
    fullName: data.fullName ?? '',
    headline: data.headline ?? '',
    summary: data.summary ?? '',
    skillGroups,
    experience,
    education: data.education ?? [],
  };
}

export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

// pdfkit trabaja por streaming (metodo .pipe()); lo adaptamos a Promise<Buffer>
// acumulando los chunks, para que el controller lo trate igual que docx.
function streamToBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
}

export async function generateCvPdf(cv: ParsedCv): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 50 });
  const bufferPromise = streamToBuffer(doc);

  doc.fontSize(20).text(cv.fullName || 'CV');
  if (cv.headline) doc.fontSize(12).fillColor('#555555').text(cv.headline);
  doc.fillColor('#000000').moveDown();

  if (cv.summary) {
    doc.fontSize(14).text('Resumen', { underline: true });
    doc.fontSize(11).text(cv.summary);
    doc.moveDown();
  }

  if (cv.skillGroups.length) {
    doc.fontSize(14).text('Skills', { underline: true });
    cv.skillGroups.forEach((g) => doc.fontSize(11).text(`${g.category}: ${g.skills.join(', ')}`));
    doc.moveDown();
  }

  if (cv.experience.length) {
    doc.fontSize(14).text('Experiencia', { underline: true });
    cv.experience.forEach((exp) => {
      doc.moveDown(0.3);
      doc.fontSize(12).text(`${exp.role} - ${exp.company} (${exp.period})`);
      exp.bullets.forEach((b) => doc.fontSize(10).text(`- ${b}`, { indent: 15 }));
    });
    doc.moveDown();
  }

  if (cv.education.length) {
    doc.fontSize(14).text('Educacion', { underline: true });
    cv.education.forEach((edu) => doc.fontSize(11).text(`${edu.degree} - ${edu.institution} (${edu.period})`));
  }

  doc.end();
  return bufferPromise;
}

export async function generateCoverLetterPdf(text: string): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 50 });
  const bufferPromise = streamToBuffer(doc);

  text
    .split(/\n+/)
    .filter(Boolean)
    .forEach((paragraph) => {
      doc.fontSize(11).text(paragraph, { align: 'left' });
      doc.moveDown();
    });

  doc.end();
  return bufferPromise;
}

export async function generateCvDocx(cv: ParsedCv): Promise<Buffer> {
  const children: Paragraph[] = [
    new Paragraph({ text: cv.fullName || 'CV', heading: HeadingLevel.TITLE }),
  ];
  if (cv.headline) children.push(new Paragraph({ text: cv.headline, spacing: { after: 200 } }));

  if (cv.summary) {
    children.push(new Paragraph({ text: 'Resumen', heading: HeadingLevel.HEADING_2 }));
    children.push(new Paragraph({ text: cv.summary, spacing: { after: 200 } }));
  }

  if (cv.skillGroups.length) {
    children.push(new Paragraph({ text: 'Skills', heading: HeadingLevel.HEADING_2 }));
    cv.skillGroups.forEach((g) =>
      children.push(new Paragraph({ text: `${g.category}: ${g.skills.join(', ')}` }))
    );
  }

  if (cv.experience.length) {
    children.push(new Paragraph({ text: 'Experiencia', heading: HeadingLevel.HEADING_2, spacing: { before: 200 } }));
    cv.experience.forEach((exp) => {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `${exp.role} - ${exp.company} (${exp.period})`, bold: true })],
        })
      );
      exp.bullets.forEach((b) => children.push(new Paragraph({ text: `- ${b}` })));
    });
  }

  if (cv.education.length) {
    children.push(new Paragraph({ text: 'Educacion', heading: HeadingLevel.HEADING_2, spacing: { before: 200 } }));
    cv.education.forEach((edu) =>
      children.push(new Paragraph({ text: `${edu.degree} - ${edu.institution} (${edu.period})` }))
    );
  }

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBuffer(doc);
}

export async function generateCoverLetterDocx(text: string): Promise<Buffer> {
  const paragraphs = text
    .split(/\n+/)
    .filter(Boolean)
    .map((p) => new Paragraph({ text: p, spacing: { after: 200 } }));

  const doc = new Document({ sections: [{ children: paragraphs }] });
  return Packer.toBuffer(doc);
}
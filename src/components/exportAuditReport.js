/**
 * VERNEN™ Audit Report — DOCX Export Utility
 * Converts audit pipeline results into a professional Word document.
 * © 2024-2026 Michael Vernen Thomas Hartmann. All Rights Reserved.
 */
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, LevelFormat, PageBreak
} from "docx";
import { saveAs } from "file-saver";

const COLORS = {
  brand: "1B3A5C",
  gold: "C9A84C",
  critical: "C94A4A",
  significant: "C9884A",
  advisory: "C9C24A",
  pass: "4A8A4A",
  gray: "666666",
  lightGray: "F2F2F2",
  white: "FFFFFF",
  black: "000000",
};

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };
const cm = { top: 60, bottom: 60, left: 100, right: 100 };

function severityColor(sev) {
  if (!sev) return COLORS.gray;
  const s = sev.toLowerCase();
  if (s === "critical") return COLORS.critical;
  if (s === "significant" || s === "major") return COLORS.significant;
  if (s === "advisory" || s === "minor") return COLORS.advisory;
  return COLORS.gray;
}

function scoreColor(score) {
  if (score == null) return COLORS.gray;
  if (score >= 80) return COLORS.pass;
  if (score >= 50) return COLORS.gold;
  return COLORS.critical;
}

/**
 * Build and download a DOCX audit report.
 * @param {Object} params
 * @param {Object} params.soc - S.o.C. identification result (parsed JSON)
 * @param {Array}  params.findings - Array of finding objects
 * @param {number} params.score - Overall compliance score (0-100)
 * @param {string} params.reportText - Full report narrative text
 * @param {Object} params.stats - { critical, significant, advisory, total }
 * @param {string} params.documentPreview - First ~200 chars of audited doc
 */
export async function exportAuditReport({
  soc = {},
  findings = [],
  score = null,
  reportText = "",
  stats = {},
  documentPreview = "",
}) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit",
  });

  const children = [];

  // ─── Title Block ───
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [new TextRun({ text: "VERNEN™", font: "Arial", size: 44, bold: true, color: COLORS.brand })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [new TextRun({ text: "S.o.C. Audit Report", font: "Arial", size: 28, color: COLORS.gray })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      children: [new TextRun({ text: `Generated ${dateStr} at ${timeStr}`, font: "Arial", size: 18, color: COLORS.gray })],
    })
  );

  // ─── Overall Score ───
  if (score != null) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
        children: [
          new TextRun({ text: "COMPLIANCE SCORE: ", font: "Arial", size: 24, bold: true, color: COLORS.brand }),
          new TextRun({ text: `${score}/100`, font: "Arial", size: 32, bold: true, color: scoreColor(score) }),
        ],
      })
    );
  }

  // ─── Findings Summary Bar ───
  if (stats.total) {
    children.push(
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2340, 2340, 2340, 2340],
        rows: [
          new TableRow({
            children: [
              { label: "CRITICAL", count: stats.critical || 0, color: COLORS.critical },
              { label: "SIGNIFICANT", count: stats.significant || 0, color: COLORS.significant },
              { label: "ADVISORY", count: stats.advisory || 0, color: COLORS.advisory },
              { label: "TOTAL", count: stats.total || 0, color: COLORS.brand },
            ].map(({ label, count, color }) =>
              new TableCell({
                borders,
                width: { size: 2340, type: WidthType.DXA },
                margins: cm,
                shading: { fill: color, type: ShadingType.CLEAR },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({ text: `${count}`, font: "Arial", size: 28, bold: true, color: COLORS.white }),
                    ],
                  }),
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({ text: label, font: "Arial", size: 14, bold: true, color: COLORS.white, allCaps: true }),
                    ],
                  }),
                ],
              })
            ),
          }),
        ],
      }),
      new Paragraph({ spacing: { after: 300 }, children: [] })
    );
  }

  // ─── S.o.C. Identification ───
  children.push(
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("1. Standard of Creation (S.o.C.)")] })
  );

  if (soc.socStatement) {
    children.push(
      new Paragraph({
        spacing: { after: 120 },
        border: { left: { style: BorderStyle.SINGLE, size: 6, color: COLORS.gold, space: 8 } },
        children: [new TextRun({ text: soc.socStatement, font: "Arial", size: 22, italics: true, color: COLORS.gold })],
      })
    );
  }

  const socRows = [
    ["Document Type", soc.docTypeLabel || soc.docType || "—"],
    ["Jurisdiction", soc.jurisdiction || "—"],
    ["S.o.C. Source", soc.socSource || "—"],
    ["Case Number", soc.caseNo || "—"],
    ["Date Issued", soc.dateIssued || "—"],
    ["Governing Body", soc.governingBody || "—"],
  ];

  children.push(
    new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [3000, 6360],
      rows: socRows.map(([k, v], i) =>
        new TableRow({
          children: [
            new TableCell({
              borders, width: { size: 3000, type: WidthType.DXA }, margins: cm,
              shading: { fill: COLORS.lightGray, type: ShadingType.CLEAR },
              children: [new Paragraph({ children: [new TextRun({ text: k, font: "Arial", size: 20, bold: true })] })],
            }),
            new TableCell({
              borders, width: { size: 6360, type: WidthType.DXA }, margins: cm,
              children: [new Paragraph({ children: [new TextRun({ text: v, font: "Arial", size: 20 })] })],
            }),
          ],
        })
      ),
    }),
    new Paragraph({ spacing: { after: 200 }, children: [] })
  );

  if (soc.governingStatutes?.length) {
    children.push(
      new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: "Governing Statutes:", font: "Arial", size: 20, bold: true })] }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ text: soc.governingStatutes.join(", "), font: "Arial", size: 20 })],
      })
    );
  }

  // ─── Findings Detail ───
  if (findings.length) {
    children.push(
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("2. Audit Findings")] })
    );

    findings.forEach((f, idx) => {
      const sev = f.severity || f.classification || "advisory";
      const sevUpper = sev.toUpperCase();

      children.push(
        new Paragraph({
          spacing: { before: 200 },
          border: { left: { style: BorderStyle.SINGLE, size: 6, color: severityColor(sev), space: 8 } },
          children: [
            new TextRun({ text: `[${sevUpper}] `, font: "Arial", size: 20, bold: true, color: severityColor(sev) }),
            new TextRun({ text: `Finding ${idx + 1}`, font: "Arial", size: 20, bold: true }),
            f.findingType ? new TextRun({ text: ` — ${f.findingType}`, font: "Arial", size: 20, color: COLORS.gray }) : new TextRun(""),
          ],
        })
      );

      if (f.finding || f.description) {
        children.push(
          new Paragraph({
            spacing: { after: 60 },
            children: [new TextRun({ text: f.finding || f.description, font: "Arial", size: 20 })],
          })
        );
      }

      if (f.evidence || f.quote) {
        children.push(
          new Paragraph({
            spacing: { after: 60 },
            border: { left: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC", space: 8 } },
            children: [
              new TextRun({ text: "Evidence: ", font: "Arial", size: 18, bold: true, color: COLORS.gray }),
              new TextRun({ text: f.evidence || f.quote, font: "Arial", size: 18, italics: true, color: COLORS.gray }),
            ],
          })
        );
      }

      if (f.violatedStandard || f.standardViolated) {
        children.push(
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({ text: "Standard Violated: ", font: "Arial", size: 18, bold: true, color: COLORS.gold }),
              new TextRun({ text: f.violatedStandard || f.standardViolated, font: "Arial", size: 18, color: COLORS.gold }),
            ],
          })
        );
      }

      if (f.legalEffect || f.impact) {
        children.push(
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "Legal Effect: ", font: "Arial", size: 18, bold: true, color: COLORS.gray }),
              new TextRun({ text: f.legalEffect || f.impact, font: "Arial", size: 18, italics: true, color: COLORS.gray }),
            ],
          })
        );
      }
    });
  }

  // ─── Full Report Narrative ───
  if (reportText) {
    children.push(
      new Paragraph({ children: [new PageBreak()] }),
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("3. Full Audit Narrative")] })
    );

    const lines = reportText.split("\n");
    lines.forEach((line) => {
      if (!line.trim()) {
        children.push(new Paragraph({ spacing: { after: 80 }, children: [] }));
      } else if (line.startsWith("===") || line.startsWith("───")) {
        // skip decorative lines
      } else if (line.startsWith("##") || line.match(/^[A-Z][A-Z\s/]+$/)) {
        children.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun(line.replace(/^#+\s*/, ""))],
          })
        );
      } else {
        const isCrit = line.includes("[CRITICAL]") || line.includes("⛔");
        const isSig = line.includes("[SIGNIFICANT]") || line.includes("⚠");
        const color = isCrit ? COLORS.critical : isSig ? COLORS.significant : undefined;
        children.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [new TextRun({ text: line, font: "Arial", size: 20, color })],
          })
        );
      }
    });
  }

  // ─── Build Document ───
  const doc = new Document({
    styles: {
      default: { document: { run: { font: "Arial", size: 22 } } },
      paragraphStyles: [
        {
          id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 30, bold: true, font: "Arial", color: COLORS.brand },
          paragraph: { spacing: { before: 360, after: 160 }, outlineLevel: 0 },
        },
        {
          id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 24, bold: true, font: "Arial", color: COLORS.brand },
          paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: COLORS.brand, space: 1 } },
                children: [
                  new TextRun({ text: "VERNEN™ S.o.C. AUDIT REPORT", font: "Arial", size: 14, color: COLORS.brand, bold: true }),
                  new TextRun({ text: `  |  ${dateStr}`, font: "Arial", size: 14, color: COLORS.gray }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                border: { top: { style: BorderStyle.SINGLE, size: 2, color: "DDDDDD", space: 1 } },
                children: [
                  new TextRun({
                    text: "© 2024-2026 Michael Vernen Thomas Hartmann. All Rights Reserved. | VERNEN™ Autonomous Audit Engine",
                    font: "Arial", size: 12, color: "AAAAAA",
                  }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  const buffer = await Packer.toBlob(doc);
  const filename = `VERNEN_Audit_Report_${now.toISOString().slice(0, 10)}.docx`;
  saveAs(buffer, filename);
  return filename;
}

import { PDFDocument } from 'pdf-lib';

/**
 * Pads a rendered directory PDF for booklet (saddle-stitch) printing.
 *
 * The inside front cover (page 2) and inside back cover (the second-to-last
 * page) are always left blank, regardless of the content page count. If the
 * resulting total page count still isn't a multiple of four, additional
 * blank pages are inserted right before the last page until it is.
 */
export async function applyBookletPadding(blob: Blob): Promise<Blob> {
  const bytes = await blob.arrayBuffer();
  const doc = await PDFDocument.load(bytes);

  const { width, height } = doc.getPage(0).getSize();

  // Inside front cover: always blank, right after the front cover.
  doc.insertPage(1, [width, height]);
  // Inside back cover: always blank, right before the last page.
  doc.insertPage(doc.getPageCount() - 1, [width, height]);

  const blanksNeeded = (4 - (doc.getPageCount() % 4)) % 4;
  for (let i = 0; i < blanksNeeded; i += 1) {
    doc.insertPage(doc.getPageCount() - 1, [width, height]);
  }

  const paddedBytes = await doc.save();
  return new Blob([paddedBytes as BlobPart], { type: 'application/pdf' });
}

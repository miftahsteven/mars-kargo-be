import { PrismaClient } from '@prisma/client';
import * as xlsx from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

const prisma = new PrismaClient();

function detectSchoolCategory(name: string): string {
  const upper = (name || '').toUpperCase().trim();
  if (
    upper.startsWith('SD') ||
    upper.startsWith('MI ') ||
    upper.includes('SEKOLAH DASAR') ||
    upper.includes('MADRASAH IBTIDAIYAH')
  ) {
    return 'SD';
  }
  // Hanya 2 jenis sekolah: SD dan SMP (mencakup SMP/MTS/SMA/PKBM/Lainnya)
  return 'SMP';
}

function cleanProvince(prov: string): string {
  if (!prov) return 'UNKNOWN';
  let cleaned = prov.trim().toUpperCase();
  cleaned = cleaned.replace(/^PROV\.\s*/i, '');
  cleaned = cleaned.replace(/^PROVINSI\s*/i, '');
  if (cleaned === 'NUSA TENGGARA TIMUR') cleaned = 'NTT';
  if (cleaned === 'NUSA TENGGARA BARAT') cleaned = 'NTB';
  return cleaned.trim();
}

export async function importExcelData(filePath: string, mode: 'replace' | 'upsert' = 'replace') {
  console.log(`[Seed/Import] Starting import from: ${filePath}`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawRows: any[][] = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

  console.log(`[Seed/Import] Sheet: "${sheetName}", Total raw rows: ${rawRows.length}`);

  // Find header row containing 'NO RESI'
  const headerIdx = rawRows.findIndex(
    (row) => Array.isArray(row) && row.some((cell) => String(cell).toUpperCase().includes('NO RESI'))
  );

  if (headerIdx === -1) {
    throw new Error('Header row with "NO RESI" not found in Excel sheet.');
  }

  const dataRows = rawRows.slice(headerIdx + 1);
  console.log(`[Seed/Import] Found header at index ${headerIdx}. Data rows count: ${dataRows.length}`);

  const records: any[] = [];
  const batchId = `batch_${Date.now()}`;

  for (let i = 0; i < dataRows.length; i++) {
    const r = dataRows[i];
    if (!r || r.length === 0) continue;

    const noResi = r[1] ? String(r[1]).trim() : null;
    if (!noResi) continue;

    const penerima = r[6] ? String(r[6]).trim() : 'Penerima';
    const schoolCategory = detectSchoolCategory(penerima);
    const rawProv = r[12] ? String(r[12]).trim() : 'UNKNOWN';
    const provinsi = cleanProvince(rawProv);

    records.push({
      no: r[0] ? Number(r[0]) : i + 1,
      noResi: noResi,
      tanggal: r[2] ? String(r[2]).trim() : null,
      pengirim: r[3] ? String(r[3]).trim() : null,
      telepon: r[4] ? String(r[4]).trim() : null,
      alamatPengirim: r[5] ? String(r[5]).trim() : null,
      penerima: penerima,
      npsn: r[7] ? String(r[7]).trim() : null,
      namaPenerima: r[8] ? String(r[8]).trim() : penerima,
      alamatPenerima: r[9] ? String(r[9]).trim() : null,
      kecamatan: r[10] ? String(r[10]).trim().toUpperCase() : '-',
      kabupatenKota: r[11] ? String(r[11]).trim().toUpperCase() : '-',
      provinsi: provinsi,
      kodePos: r[13] ? String(r[13]).trim() : '-',
      jenisBarang: r[14] ? String(r[14]).trim() : 'BUKU',
      koli: r[15] ? Number(r[15]) : 1,
      kg: r[16] ? Number(r[16]) : null,
      service: r[17] ? String(r[17]).trim() : 'REGULER',
      origin: r[18] ? String(r[18]).trim() : 'JAKARTA',
      destination: r[19] ? String(r[19]).trim() : null,
      pembayaran: r[20] ? String(r[20]).trim() : 'Tidak Langsung',
      status: 'Terkirim',
      schoolCategory: schoolCategory,
      uploadBatchId: batchId,
    });
  }

  console.log(`[Seed/Import] Validated records to insert: ${records.length}`);

  if (mode === 'replace') {
    console.log('[Seed/Import] Mode is REPLACE: clearing existing DistribusiReal table...');
    await prisma.distribusiReal.deleteMany({});
  }

  const chunkSize = 1000;
  let insertedCount = 0;
  const startTime = Date.now();

  for (let i = 0; i < records.length; i += chunkSize) {
    const chunk = records.slice(i, i + chunkSize);
    const res = await prisma.distribusiReal.createMany({
      data: chunk,
      skipDuplicates: true,
    });
    insertedCount += res.count;
    process.stdout.write(`\r[Seed/Import] Inserted ${insertedCount}/${records.length} records...`);
  }

  const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n✅ [Seed/Import] Successfully inserted ${insertedCount} records in ${elapsedSec}s!`);

  // Verification counts
  const totalInDb = await prisma.distribusiReal.count();
  const distinctProv = await prisma.distribusiReal.groupBy({
    by: ['provinsi'],
    _count: { noResi: true },
    _sum: { koli: true },
    orderBy: { _sum: { koli: 'desc' } },
  });

  console.log(`📊 [Verification] Total rows in DB: ${totalInDb}`);
  console.log(`📊 [Verification] Total provinces: ${distinctProv.length}`);
  console.log(`📊 [Verification] Top 5 Provinces:`);
  distinctProv.slice(0, 5).forEach((p) => {
    console.log(`   - ${p.provinsi}: ${p._count.noResi} resi, ${p._sum.koli} koli`);
  });

  return {
    totalRecords: totalInDb,
    inserted: insertedCount,
    provincesCount: distinctProv.length,
    batchId,
  };
}

async function main() {
  const filePath =
    process.argv[2] ||
    path.join(__dirname, '../../mars-kargo/Draft Resi Pengiriman.xlsx');

  try {
    await importExcelData(filePath, 'replace');
    console.log('🎉 Seeding completed successfully!');
  } catch (err) {
    console.error('❌ Error during seeding:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1]?.includes('seed-distribusi-real')) {
  main();
}

import { prisma } from '../src/lib/prisma.js';

async function resetTestData() {
  console.log('🧹 Starting data reset for testing packages & user mscodx@gmail.com...');

  try {
    // 1. Find user mscodx@gmail.com if exists
    const targetUser = await prisma.user.findFirst({
      where: { email: { equals: 'mscodx@gmail.com', mode: 'insensitive' } },
    });

    console.log('Target User found:', targetUser ? `${targetUser.fullName} (${targetUser.email})` : 'None');

    // 2. Delete all DeliveryTask records
    const deletedTasks = await prisma.deliveryTask.deleteMany({});
    console.log(`✅ Deleted ${deletedTasks.count} DeliveryTask records from PostgreSQL database.`);

    // 3. Delete all ScanLog records
    const deletedScanLogs = await prisma.scanLog.deleteMany({});
    console.log(`✅ Deleted ${deletedScanLogs.count} ScanLog records from PostgreSQL database.`);

    // 4. Delete all IssueReport records
    const deletedIssueReports = await prisma.issueReport.deleteMany({});
    console.log(`✅ Deleted ${deletedIssueReports.count} IssueReport records from PostgreSQL database.`);

    // 5. Delete all GPSLocationLog records
    const deletedGPS = await prisma.gPSLocationLog.deleteMany({});
    console.log(`✅ Deleted ${deletedGPS.count} GPSLocationLog records from PostgreSQL database.`);

    console.log('🎉 Reset complete! All scanned delivery tasks have been wiped.');
  } catch (error) {
    console.error('❌ Error during data reset:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetTestData();

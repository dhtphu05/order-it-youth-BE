
import { PrismaClient } from '@prisma/client';

async function main() {
    const prisma = new PrismaClient();
    try {
        console.log('--- Checking Recent Orders ---');
        const recentOrders = await prisma.orders.findMany({
            take: 5,
            orderBy: { created_at: 'desc' },
            include: { team: true }
        });

        if (recentOrders.length === 0) {
            console.log('No orders found.');
        } else {
            recentOrders.forEach(o => {
                console.log(`Order: ${o.code}, ID: ${o.id}, Created: ${o.created_at}, Team: ${o.team?.name || 'NULL'} (${o.team_id})`);
            });
        }

        console.log('\n--- Checking Active Teams ---');
        const teams = await prisma.teams.findMany({ where: { is_active: true } });
        if (teams.length === 0) {
            console.log('No active teams found!');
        } else {
            teams.forEach(t => console.log(`Team: ${t.name}, ID: ${t.id}, Code: ${t.code}`));
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();

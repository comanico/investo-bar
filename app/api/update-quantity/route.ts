import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { userId } = await auth()
        const whitelistedUserIds = (process.env.WHITELISTED_USERS || '').split(',')

        if (!userId || !whitelistedUserIds.includes(userId)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        const { menu: menuItems, username } = await req.json();

        if (!Array.isArray(menuItems)) {
            return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const productMap: { [key: string]: { model: any; column: string } } = {
            "Heineken": { model: prismadb.bere, column: 'Heineken' },
            "Corona": { model: prismadb.bere, column: 'Corona' },
            "Peroni": { model: prismadb.bere, column: 'Peroni' },
            "Aperol Spritz": { model: prismadb.vin, column: 'Aperol_Spritz' },
            "Prosecco": { model: prismadb.vin, column: 'Prosecco' },
            "Vin Rosu": { model: prismadb.vin, column: 'Vin_Rosu' },
            "Vin Alb": { model: prismadb.vin, column: 'Vin_Alb' },
            "Vin Spumant Fara Alcool": { model: prismadb.racoritoare, column: 'Vin_Spumant_Fara_Alcool'},
            "Cola": { model: prismadb.racoritoare, column: 'Cola' },
            "Apa": { model: prismadb.racoritoare, column: 'Apa' },
        }

        for (const item of menuItems) {
            if (item.quantity > 0 && productMap[item.product]) {
                const { model, column } = productMap[item.product];

                const lastRow = await model.findFirst({
                    orderBy: { id: 'desc' },
                    select: { id: true }
                });

                if (!lastRow) {
                    const newRow = await model.create({ data: {} });
                    await model.update({
                        where: { id: newRow.id },
                        data: { [column]: { increment: item.quantity } }
                    });
                } else {
                    await model.update({
                        where: { id: lastRow.id },
                        data: { [column]: { increment: item.quantity } }
                    })
                }
                
                // Adding sales record once quantity updated
                await prismadb.sales.create({
                    data: {
                        product: item.product,
                        type: item.type,
                        price: item.price,
                        quantity: item.quantity,
                        username: username || 'Unknown User',
                    }
                });
            }
        }

        return NextResponse.json({ message: 'Quantities updated successfully' })
    }
    catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to update price" }, { status: 500 })
    }
}
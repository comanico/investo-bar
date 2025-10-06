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

        const menuItems = await req.json();

        if (!Array.isArray(menuItems)) {
            return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const productMap: { [key: string]: { model: any; column: string } } = {
            "Heineken": { model: prismadb.bere, column: 'Heineken' },
            "Corona": { model: prismadb.bere, column: 'Corona' },
            "Aperol": { model: prismadb.vin, column: 'Aperol' },
            "Prosecco": { model: prismadb.vin, column: 'Prosecco' },
            "Cola": { model: prismadb.racoritoare, column: 'Cola' },
            "Apa": { model: prismadb.racoritoare, column: 'Apa_Plata' },
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
            }

            // Adding sales record once quantity updated
            await prismadb.sales.create({
                data: {
                    product: item.product,
                    type: item.type,
                    price: item.price,
                    quantity: item.quantity
                }
            });

        }

        return NextResponse.json({ message: 'Quantities updated successfully' })
    }
    catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to update price" }, { status: 500 })
    }
}
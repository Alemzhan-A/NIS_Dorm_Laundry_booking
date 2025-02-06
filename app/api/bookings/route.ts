import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

// GET /api/bookings
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("laundry");

    // Получаем все бронирования и сортируем по времени начала
    const bookings = await db
      .collection("bookings")
      .find({})
      .sort({ startTime: 1 })
      .toArray();

    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: 'Failed to read bookings' }, { status: 500 });
  }
}

// POST /api/bookings
export async function POST(request: Request) {
  try {
    const booking = await request.json();
    const client = await clientPromise;
    const db = client.db("laundry");

    // Сохраняем бронирование
    const result = await db.collection("bookings").insertOne({
      roomBed: booking.roomBed,        // "301-1"
      startTime: new Date(booking.startTime).toISOString(),  // время начала
      endTime: new Date(booking.endTime).toISOString(),      // время окончания
      mode: booking.mode,              // "quick" или "delicate"
      color: booking.color,            // цвет для отображения
      createdAt: new Date().toISOString() // когда было создано бронирование
    });

    return NextResponse.json({
      ...booking,
      _id: result.insertedId,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: 'Failed to add booking' }, { status: 500 });
  }
} 
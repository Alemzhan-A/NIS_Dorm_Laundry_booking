import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

// GET /api/bookings
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const floor = parseInt(searchParams.get('floor') || '1');

    const client = await clientPromise;
    const db = client.db("laundry");

    const bookings = await db
      .collection("bookings")
      .find({ floor: floor })
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

    // Убедимся, что floor сохраняется как число
    const result = await db.collection("bookings").insertOne({
      roomBed: booking.roomBed,
      startTime: new Date(booking.startTime).toISOString(),
      endTime: new Date(booking.endTime).toISOString(),
      mode: booking.mode,
      color: booking.color,
      floor: parseInt(booking.floor), // Преобразуем в число
      createdAt: new Date().toISOString()
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
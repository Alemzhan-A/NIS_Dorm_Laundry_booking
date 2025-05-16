import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

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
      createdAt: new Date().toISOString(),
      password: booking.password
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

// Добавляем обработчик DELETE
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const password = searchParams.get('password');

    if (!id || !password) {
      return new Response(JSON.stringify({ error: 'Missing id or password' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const client = await clientPromise;
    const db = client.db("laundry");

    // Проверяем пароль перед удалением
    const booking = await db.collection("bookings").findOne({ _id: new ObjectId(id) });

    if (!booking) {
      return new Response(JSON.stringify({ error: 'Booking not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (booking.password !== password) {
      return new Response(JSON.stringify({ error: 'Invalid password' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await db.collection("bookings").deleteOne({ _id: new ObjectId(id) });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting booking:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete booking' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 
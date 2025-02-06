import { NextResponse } from 'next/server';
import * as fs from 'fs/promises';
import path from 'path';
import { log } from 'console';

const dataFilePath = path.join(process.cwd(), 'data', 'bookings.json');

// GET /api/bookings
export async function GET() {
  try {
    const jsonData = await fs.readFile(dataFilePath, 'utf8');
    const data = JSON.parse(jsonData);
    return NextResponse.json(data.bookings);
  } catch (error) {
    console.log(error)
    return NextResponse.json({ error: 'Failed to read bookings' }, { status: 500 });
  }
}

// POST /api/bookings
export async function POST(request: Request) {
  try {
    const booking = await request.json();
    const jsonData = await fs.readFile(dataFilePath, 'utf8');
    const data = JSON.parse(jsonData);

    data.bookings.push({
      ...booking,
      startTime: new Date(booking.startTime).toISOString(),
      endTime: new Date(booking.endTime).toISOString()
    });

    await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2));
    return NextResponse.json(booking);
  } catch (error) {
    console.log(error)
    return NextResponse.json({ error: 'Failed to add booking' }, { status: 500 });
  }
} 